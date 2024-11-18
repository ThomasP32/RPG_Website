import { DoorTile } from '@app/http/model/schemas/map/tiles.schema';
import { GameCreationService } from '@app/socket/game/service/game-creation/game-creation.service';
import { GameManagerService } from '@app/socket/game/service/game-manager/game-manager.service';
import { JournalService } from '@app/socket/game/service/journal/journal.service';
import { TIME_FOR_POSITION_UPDATE } from '@common/constants';
import { Coordinate } from '@common/map.types';
import { Inject } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameCountdownService } from '../../service/countdown/game/game-countdown.service';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class GameManagerGateway implements OnGatewayInit {
    @WebSocketServer()
    server: Server;

    @Inject(GameCreationService) private gameCreationService: GameCreationService;
    @Inject(GameManagerService) private gameManagerService: GameManagerService;
    @Inject(GameCountdownService) private gameCountdownService: GameCountdownService;
    @Inject(JournalService) private journalService: JournalService;

    afterInit(server: Server) {
        this.gameCountdownService.setServer(this.server);
        this.gameCountdownService.on('timeout', (gameId: string) => {
            this.prepareNextTurn(gameId);
        });
        this.journalService.initializeServer(server);
    }

    @SubscribeMessage('getMovements')
    getMoves(client: Socket, gameId: string): void {
        if (!this.gameCreationService.doesGameExist(gameId)) {
            client.emit('gameNotFound');
            return;
        }
        const moves = this.gameManagerService.getMoves(gameId, client.id);
        client.emit('playerPossibleMoves', moves);
    }

    @SubscribeMessage('moveToPosition')
    async getMove(client: Socket, data: { gameId: string; destination: Coordinate }): Promise<void> {
        let wasOnIceTile = false;
        if (!this.gameCreationService.doesGameExist(data.gameId)) {
            client.emit('gameNotFound');
            return;
        }
        const game = this.gameCreationService.getGameById(data.gameId);
        const player = game.players.filter((player) => player.socketId === client.id)[0];
        const beforeMoveInventory = [...player.inventory];
        const moves = this.gameManagerService.getMove(data.gameId, client.id, data.destination);
        if (this.gameManagerService.onIceTile(player, game.id)) {
            wasOnIceTile = true;
        }

        if (moves.length === 0) {
            return;
        }

        moves.shift();

        for (const move of moves) {
            this.gameManagerService.updatePosition(data.gameId, client.id, [move]);

            const isOnIceTile = this.gameManagerService.onIceTile(player, game.id);
            if (isOnIceTile && !wasOnIceTile) {
                player.specs.attack -= 2;
                player.specs.defense -= 2;
                wasOnIceTile = true;
            } else if (!isOnIceTile && wasOnIceTile) {
                player.specs.attack += 2;
                player.specs.defense += 2;
                wasOnIceTile = false;
            }
            this.server.to(data.gameId).emit('positionToUpdate', { game: game, player: player });
            await new Promise((resolve) => setTimeout(resolve, TIME_FOR_POSITION_UPDATE));
            if (this.gameManagerService.checkForWinnerCtf(player, data.gameId)) {
                this.server.to(data.gameId).emit('gameFinishedPlayerWon', { winner: player });
                return;
            }
        }

        if (this.gameManagerService.hasPickedUpFlag(beforeMoveInventory, player.inventory)) {
            this.server.to(data.gameId).emit('flagPickedUp', game);
            this.server.to(client.id).emit('youFinishedMoving');
            this.journalService.logMessage(
                data.gameId,
                `Le drapeau a été récupéré par ${player.name}.`,
                game.players.map((player) => player.name),
            );
        } else if (this.gameManagerService.hasFallen(moves, data.destination)) {
            this.server.to(client.id).emit('youFell');
        } else {
            this.server.to(client.id).emit('youFinishedMoving');
        }
    }

    @SubscribeMessage('toggleDoor')
    toggleDoor(client: Socket, data: { gameId: string; door: DoorTile }): void {
        const game = this.gameCreationService.getGameById(data.gameId);
        const player = game.players.find((player) => player.socketId === client.id);
        const doorTile = game.doorTiles.find((door) => door.coordinate.x === data.door.coordinate.x && door.coordinate.y === data.door.coordinate.y);
        if (!doorTile) {
            console.error(`Door not found at coordinates (${data.door.coordinate.x}, ${data.door.coordinate.y}) in game ${data.gameId}`);
            return;
        }
        this.gameManagerService.updatePlayerActions(data.gameId, client.id);
        doorTile.isOpened = !doorTile.isOpened;
        this.server.to(data.gameId).emit('doorToggled', { game: game, player: player });
    }

    @SubscribeMessage('getCombats')
    getCombats(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        const player = game.players.find((player) => player.socketId === client.id);
        const adjacentPlayers = this.gameManagerService.getAdjacentPlayers(player, gameId);
        this.server.to(client.id).emit('yourCombats', adjacentPlayers);
    }

    @SubscribeMessage('getAdjacentDoors')
    getAdjacentDoors(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        const player = game.players.find((player) => player.socketId === client.id);
        const adjacentDoors = this.gameManagerService.getAdjacentDoors(player, gameId);
        this.server.to(client.id).emit('yourDoors', adjacentDoors);
    }

    @SubscribeMessage('startGame')
    startGame(client: Socket, gameId: string): void {
        this.gameCountdownService.initCountdown(gameId, 30);
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
        player.specs.actions = 1;
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
            this.gameCountdownService.deleteCountdown(gameId);
            return;
        }
        const activePlayer = game.players.find((player) => player.turn === game.currentTurn);
        const involvedPlayers = game.players.map((player) => player.name);

        if (!activePlayer || !activePlayer.isActive) {
            game.currentTurn++;
            this.startTurn(gameId);
            return;
        }
        this.journalService.logMessage(gameId, `C'est au tour de ${activePlayer.name}.`, involvedPlayers);
        activePlayer.specs.movePoints = activePlayer.specs.speed;
        activePlayer.specs.actions = 1;
        this.server.to(activePlayer.socketId).emit('yourTurn', activePlayer);
        game.players
            .filter((player) => player.socketId !== activePlayer.socketId)
            .forEach((player) => {
                if (player.socketId !== activePlayer.socketId) {
                    this.server.to(player.socketId).emit('playerTurn', activePlayer.name);
                }
            });
        this.gameCountdownService.startNewCountdown(gameId);
    }
}
