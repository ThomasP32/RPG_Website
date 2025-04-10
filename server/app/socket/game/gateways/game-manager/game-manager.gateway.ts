import { DoorTile } from '@app/http/model/schemas/map/tiles.schema';
import { GameCountdownService } from '@app/services/countdown/game/game-countdown.service';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameManagerService } from '@app/services/game-manager/game-manager.service';
import { JournalService } from '@app/services/journal/journal.service';
import { VirtualGameManagerService } from '@app/services/virtual-game-manager/virtual-game-manager.service';
import {
    DEFAULT_ACTIONS,
    INVENTORY_SIZE,
    TIME_FOR_POSITION_UPDATE,
    TURN_DURATION,
    VIRTUAL_DELAY_CONSTANT,
    VIRTUAL_PLAYER_DELAY,
} from '@common/constants';
import { CombatEvents } from '@common/events/combat.events';
import { GameCreationEvents } from '@common/events/game-creation.events';
import { GameManagerEvents } from '@common/events/game-manager.events';
import { GameTurnEvents } from '@common/events/game-turn.events';
import { DropItemData, ItemDroppedData, ItemsEvents } from '@common/events/items.events';
import { VirtualPlayerEvents } from '@common/events/virtualPlayer.events';
import { Game, Player } from '@common/game';
import { Coordinate, Tile } from '@common/map.types';
import { Inject } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ItemsManagerService } from '../../../../services/items-manager/items-manager.service';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class GameManagerGateway implements OnGatewayInit {
    @WebSocketServer()
    server: Server;

    @Inject(GameCreationService) private readonly gameCreationService: GameCreationService;
    @Inject(GameManagerService) private readonly gameManagerService: GameManagerService;
    @Inject(GameCountdownService) private readonly gameCountdownService: GameCountdownService;
    @Inject(JournalService) private readonly journalService: JournalService;
    @Inject(VirtualGameManagerService) private virtualGameManagerService: VirtualGameManagerService;
    @Inject(ItemsManagerService) private readonly itemsManagerService: ItemsManagerService;

    afterInit(server: Server) {
        this.gameCountdownService.setServer(this.server);
        this.gameCountdownService.on('timeout', (gameId: string) => {
            this.prepareNextTurn(gameId);
        });
        this.virtualGameManagerService.setServer(this.server);
        this.virtualGameManagerService.on('virtualPlayerFinishedMoving', (gameId: string) => {
            this.prepareNextTurn(gameId);
        });
        this.virtualGameManagerService.on('virtualPlayerCanResumeTurn', (gameId: string) => {
            this.startTurn(gameId);
        });
        this.journalService.initializeServer(server);
    }

    @SubscribeMessage('getMovements')
    getMoves(client: Socket, gameId: string): void {
        if (!this.gameCreationService.doesGameExist(gameId)) {
            client.emit(GameCreationEvents.GameNotFound);
            return;
        }
        const moves = this.gameManagerService.getMoves(gameId, client.id);
        client.emit(GameManagerEvents.PlayerPossibleMoves, moves);
    }

    @SubscribeMessage('moveToPosition')
    async getMove(client: Socket, data: { gameId: string; destination: Coordinate }): Promise<void> {
        let wasOnIceTile = false;
        if (!this.gameCreationService.doesGameExist(data.gameId)) {
            client.emit(GameCreationEvents.GameNotFound);
            return;
        }
        const game = this.gameCreationService.getGameById(data.gameId);

        const player = game.players.filter((player) => player.socketId === client.id)[0];
        const beforeMoveInventory = [...player.inventory];
        const moves = this.gameManagerService.getMove(data.gameId, client.id, data.destination);
        if (this.gameManagerService.onIceTile(player, game.id)) wasOnIceTile = true;
        if (moves.length === 0) return;
        const gameFinished = await this.movePlayer(moves, game, wasOnIceTile, player);

        if (!gameFinished) {
            if (this.gameManagerService.hasPickedUpFlag(beforeMoveInventory, player.inventory)) {
                this.server.to(data.gameId).emit(GameManagerEvents.FlagPickup, game);
                this.server.to(client.id).emit(GameManagerEvents.YouFinishedMoving);
                this.journalService.logMessage(
                    data.gameId,
                    `Le drapeau a été récupéré par ${player.name}.`,
                    game.players.map((player) => player.name),
                );
            } else if (this.gameManagerService.hasFallen) {
                this.server.to(client.id).emit(GameManagerEvents.YouFell);
                this.gameManagerService.hasFallen = false;
                if (player.socketId.includes('virtualPlayer')) {
                    this.server.to(data.gameId).emit(VirtualPlayerEvents.VirtualPlayerFinishedMoving, data.gameId);
                    this.gameManagerService.hasFallen = false;
                }
            } else {
                this.server.to(client.id).emit(GameManagerEvents.YouFinishedMoving);
            }
        }
    }

    @SubscribeMessage('toggleDoor')
    toggleDoor(client: Socket, data: { gameId: string; door: DoorTile }): void {
        const game = this.gameCreationService.getGameById(data.gameId);
        const player = game.players.find((player) => player.socketId === client.id);
        const doorTile = game.doorTiles.find((door) => door.coordinate.x === data.door.coordinate.x && door.coordinate.y === data.door.coordinate.y);
        this.gameManagerService.updatePlayerActions(game.id, player.socketId);
        doorTile.isOpened = !doorTile.isOpened;
        game.nDoorsManipulated.push(doorTile.coordinate);
        const action = doorTile.isOpened ? 'ouverte' : 'fermée';
        const involvedPlayers = game.players.map((player) => player.name);
        this.journalService.logMessage(data.gameId, `Une porte a été ${action} par ${player.name}.`, involvedPlayers);
        this.server.to(data.gameId).emit(ItemsEvents.DoorToggled, { game: game, player: player });
    }

    @SubscribeMessage('breakWall')
    breakWall(client: Socket, data: { gameId: string; wall: Tile }): void {
        const game = this.gameCreationService.getGameById(data.gameId);
        const player = game.players.find((player) => player.socketId === client.id);
        const wallTiles = this.gameManagerService.getAdjacentWalls(player, game.id);

        wallTiles.forEach((wallTile) => {
            const index = game.tiles.findIndex((tile) => tile.coordinate.x === wallTile.coordinate.x && tile.coordinate.y === wallTile.coordinate.y);

            if (index !== -1) {
                game.tiles.splice(index, 1);
            }
        });
        this.gameManagerService.updatePlayerActions(game.id, player.socketId);
        const involvedPlayers = game.players.map((player) => player.name);
        this.journalService.logMessage(data.gameId, `${player.name}. a brisé un mur !`, involvedPlayers);
        this.server.to(data.gameId).emit(ItemsEvents.WallBroken, { game: game, player: player });
    }

    @SubscribeMessage('getCombats')
    getCombats(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        const player = game.players.find((player) => player.socketId === client.id);
        const adjacentPlayers = this.gameManagerService.getAdjacentPlayers(player, gameId);
        this.server.to(client.id).emit(GameManagerEvents.YourCombats, adjacentPlayers);
    }

    @SubscribeMessage('getAdjacentDoors')
    getAdjacentDoors(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        const player = game.players.find((player) => player.socketId === client.id);
        const adjacentDoors = this.gameManagerService.getAdjacentDoors(player, gameId);
        this.server.to(client.id).emit(GameManagerEvents.YourDoors, adjacentDoors);
    }

    @SubscribeMessage('getAdjacentWalls')
    getAdjacentWalls(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        const player = game.players.find((player) => player.socketId === client.id);
        const adjacentWalls = this.gameManagerService.getAdjacentWalls(player, gameId);
        this.server.to(client.id).emit(GameManagerEvents.YourWalls, adjacentWalls);
    }

    @SubscribeMessage(ItemsEvents.dropItem)
    dropItem(client: Socket, data: DropItemData): void {
        const game = this.gameCreationService.getGameById(data.gameId);
        const player = game.players.find((player) => player.socketId === client.id);
        const coordinates = player.position;
        this.itemsManagerService.dropItem(data.itemDropping, game.id, player, coordinates);
        const itemDroppedData: ItemDroppedData = { updatedGame: game, updatedPlayer: player };
        this.server.to(player.socketId).emit(ItemsEvents.ItemDropped, itemDroppedData);
    }
    @SubscribeMessage('startGame')
    startGame(client: Socket, gameId: string): void {
        this.gameCountdownService.initCountdown(gameId, TURN_DURATION);
        this.startTurn(gameId);
    }

    @SubscribeMessage('endTurn')
    endTurn(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        const player = game.players.find((player) => player.turn === game.currentTurn);
        if (player.socketId !== client.id) {
            return;
        }
        player.specs.movePoints = player.specs.speed;
        player.specs.actions = DEFAULT_ACTIONS;
        this.prepareNextTurn(gameId);
    }

    prepareNextTurn(gameId: string): void {
        this.gameCountdownService.resetTimerSubscription(gameId);
        this.gameManagerService.updateTurnCounter(gameId);

        this.startTurn(gameId);
    }

    startTurn(gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        if (!this.gameManagerService.isGameResumable(gameId)) {
            this.gameCreationService.deleteRoom(gameId);
            this.gameCountdownService.resetTimerSubscription(gameId);
            this.gameCountdownService.deleteCountdown(gameId);
            return;
        }
        const activePlayer = game.players.find((player) => player.turn === game.currentTurn);
        const involvedPlayers = game.players.map((player) => player.name);
        if (!activePlayer?.isActive) {
            game.currentTurn++;
            this.startTurn(gameId);
            return;
        }
        game.nTurns++;
        this.journalService.logMessage(gameId, `C'est au tour de ${activePlayer.name}.`, involvedPlayers);
        activePlayer.specs.movePoints = activePlayer.specs.speed;
        activePlayer.specs.actions = DEFAULT_ACTIONS;

        this.gameCountdownService.startNewCountdown(game);

        if (activePlayer.socketId.includes('virtualPlayer')) {
            const delay = Math.floor(Math.random() * VIRTUAL_PLAYER_DELAY) + VIRTUAL_DELAY_CONSTANT;
            setTimeout(async () => {
                await this.virtualGameManagerService.executeVirtualPlayerBehavior(activePlayer, game);
                this.server.to(game.id).emit(GameManagerEvents.PositionToUpdate, { game: game, player: activePlayer });
            }, delay);
        } else {
            this.server.to(activePlayer.socketId).emit(GameTurnEvents.YourTurn, activePlayer);
        }

        game.players
            .filter((player) => player.socketId !== activePlayer.socketId)
            .forEach((player) => {
                if (player.socketId !== activePlayer.socketId) {
                    this.server.to(player.socketId).emit(GameTurnEvents.PlayerTurn, activePlayer.name);
                    if (player.inventory.length > INVENTORY_SIZE) {
                        const coordinates = player.position;
                        this.itemsManagerService.dropItem(player.inventory[INVENTORY_SIZE], game.id, player, coordinates);
                        const itemDroppedData: ItemDroppedData = { updatedGame: game, updatedPlayer: player };
                        this.server.to(game.id).emit(ItemsEvents.ItemDropped, itemDroppedData);
                    }
                }
            });
    }

    async movePlayer(moves: Coordinate[], game: Game, wasOnIceTile: boolean, player: Player): Promise<boolean> {
        for (const move of moves) {
            this.gameManagerService.updatePosition(game.id, player.socketId, [move]);
            const onItem = this.itemsManagerService.onItem(player, game.id);
            if (onItem) {
                this.itemsManagerService.pickUpItem(move, game.id, player);
                if (player.inventory.length > INVENTORY_SIZE) {
                    this.server.to(player.socketId).emit(ItemsEvents.InventoryFull);
                }
            }
            wasOnIceTile = this.gameManagerService.adaptSpecsForIceTileMove(player, game.id, wasOnIceTile);
            this.server.to(game.id).emit(GameManagerEvents.PositionToUpdate, { game: game, player: player });
            await new Promise((resolve) => setTimeout(resolve, TIME_FOR_POSITION_UPDATE));
            if (this.gameManagerService.checkForWinnerCtf(player, game.id)) {
                this.server.to(game.id).emit(CombatEvents.GameFinishedPlayerWon, player);
                return true;
            }
        }
        return false;
    }
}
