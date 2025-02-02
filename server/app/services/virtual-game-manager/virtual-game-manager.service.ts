import { Combat } from '@common/combat';
import {
    CONTINUE_ODDS,
    COUNTDOWN_COMBAT_DURATION,
    EVASION_SUCCESS_RATE,
    INVENTORY_SIZE,
    MAXIMUM_BONUS,
    MINIMUM_BONUS,
    MINIMUM_MOVES,
    ProfileType,
    TIME_FOR_POSITION_UPDATE,
} from '@common/constants';
import { CombatEvents, CombatStartedData } from '@common/events/combat.events';
import { GameManagerEvents } from '@common/events/game-manager.events';
import { ItemsEvents } from '@common/events/items.events';
import { VirtualPlayerEvents } from '@common/events/virtualPlayer.events';
import { Game, Player } from '@common/game';
import { Coordinate, Item, ItemCategory } from '@common/map.types';
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common/decorators/core/inject.decorator';
import { Server } from 'socket.io';
import { EventEmitter } from 'stream';
import { CombatService } from '../combat/combat.service';
import { CombatCountdownService } from '../countdown/combat/combat-countdown.service';
import { GameCountdownService } from '../countdown/game/game-countdown.service';
import { GameCreationService } from '../game-creation/game-creation.service';
import { GameManagerService } from '../game-manager/game-manager.service';
import { ItemsManagerService } from '../items-manager/items-manager.service';
import { JournalService } from '../journal/journal.service';

@Injectable()
export class VirtualGameManagerService extends EventEmitter {
    @Inject(GameCreationService) private readonly gameCreationService: GameCreationService;
    @Inject(GameManagerService) private readonly gameManagerService: GameManagerService;
    @Inject(CombatService) private readonly combatService: CombatService;
    @Inject(JournalService) private readonly journalService: JournalService;
    @Inject(CombatCountdownService) private readonly combatCountdownService: CombatCountdownService;
    @Inject(GameCountdownService) private readonly gameCountdownService: GameCountdownService;
    @Inject(ItemsManagerService) private readonly itemsManagerService: ItemsManagerService;
    server: Server;
    hasFallen: boolean = false;

    setServer(server: Server): void {
        this.server = server;
    }

    async executeVirtualPlayerBehavior(player: Player, game: Game): Promise<void> {
        this.checkAndToggleDoor(player, game);
        if (player.profile === ProfileType.AGGRESSIVE) {
            await this.executeAggressiveBehavior(player, game);
        } else if (player.profile === ProfileType.DEFENSIVE) {
            await this.executeDefensiveBehavior(player, game);
        }
    }

    calculateVirtualPlayerPath(player: Player, game: Game): Coordinate[] {
        const possibleMoves = this.gameManagerService.getMoves(game.id, player.socketId);
        const hasSkates = player.inventory.includes(ItemCategory.IceSkates);
        const finalPath: Coordinate[] = [];
        if (possibleMoves.length === MINIMUM_MOVES) {
            this.emit(VirtualPlayerEvents.VirtualPlayerFinishedMoving, game.id);
            return [];
        }
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        randomMove[1].path[randomMove[1].path.length - MINIMUM_MOVES];
        for (const position of randomMove[1].path) {
            if (this.gameManagerService.getTileWeight(position, game) === 0 && Math.random() <= 0.1 && !hasSkates) {
                this.hasFallen = true;
                finalPath.push(position);
                break;
            } else {
                finalPath.push(position);
            }
        }
        return finalPath;
    }

    async updateVirtualPlayerPosition(player: Player, gameId: string): Promise<boolean> {
        const game = this.gameCreationService.getGameById(gameId);
        let wasOnIceTile = false;
        if (this.gameManagerService.onIceTile(player, game.id)) wasOnIceTile = true;
        if (player) {
            const path = this.calculateVirtualPlayerPath(player, game);
            if (path.length === 0) return false;
            await this.updatePosition(player, path, game.id, wasOnIceTile);
            return true;
        }
    }

    async updatePosition(player: Player, path: Coordinate[], gameId: string, wasOnIceTile: boolean) {
        const game = this.gameCreationService.getGameById(gameId);
        for (const move of path) {
            this.gameManagerService.updatePosition(game.id, player.socketId, [move]);
            const onItem = this.itemsManagerService.onItem(player, game.id);
            if (onItem) {
                this.itemsManagerService.pickUpItem(move, game.id, player);
                if (player.inventory.length > INVENTORY_SIZE) {
                    this.server.to(player.socketId).emit(ItemsEvents.InventoryFull);
                }
            }
            wasOnIceTile = this.gameManagerService.adaptSpecsForIceTileMove(player, gameId, wasOnIceTile);
            this.server.to(gameId).emit(GameManagerEvents.PositionToUpdate, { game: game, player: player });
            await new Promise((resolve) => setTimeout(resolve, TIME_FOR_POSITION_UPDATE));
            if (this.gameManagerService.checkForWinnerCtf(player, game.id)) {
                this.server.to(game.id).emit(CombatEvents.GameFinishedPlayerWon, player);
            }
        }
        player.position = path[path.length - MINIMUM_MOVES];
    }

    async executeAggressiveBehavior(activePlayer: Player, game: Game): Promise<void> {
        const possibleMoves = this.gameManagerService.getMoves(game.id, activePlayer.socketId);
        const area = this.getAdjacentTilesToPossibleMoves(possibleMoves);
        const visiblePlayers = this.getPlayersInArea(area, game.players, activePlayer);
        const visibleItems = this.getItemsInArea(area, game);
        const sword = visibleItems.filter((item) => item.category === 'sword')[0];
        const wasOnIceTile = this.gameManagerService.onIceTile(activePlayer, game.id) ? true : false;

        if (visiblePlayers.length > 0 && activePlayer.specs.actions > 0) {
            await this.moveToTargetPlayer(activePlayer, visiblePlayers, wasOnIceTile, game, possibleMoves);
        } else if (sword) {
            await this.moveToTargetItem(activePlayer, visibleItems, wasOnIceTile, game);
            this.itemsManagerService.pickUpItem(sword.coordinate, game.id, activePlayer);
            activePlayer.specs.movePoints > 0
                ? await this.executeAggressiveBehavior(activePlayer, game)
                : this.emit(VirtualPlayerEvents.VirtualPlayerFinishedMoving, game.id);
        } else {
            const moved = await this.updateVirtualPlayerPosition(activePlayer, game.id);
            moved &&
                (activePlayer.specs.actions < 0 || activePlayer.specs.movePoints < 0
                    ? this.emit(VirtualPlayerEvents.VirtualPlayerFinishedMoving, game.id)
                    : Math.random() < CONTINUE_ODDS
                    ? await this.executeAggressiveBehavior(activePlayer, game)
                    : this.emit(VirtualPlayerEvents.VirtualPlayerFinishedMoving, game.id));
        }
    }

    async executeDefensiveBehavior(activePlayer: Player, game: Game): Promise<void> {
        const possibleMoves = this.gameManagerService.getMoves(game.id, activePlayer.socketId);
        const area = this.getAdjacentTilesToPossibleMoves(possibleMoves);
        const visiblePlayers = this.getPlayersInArea(area, game.players, activePlayer);
        const visibleItems = this.getItemsInArea(area, game);
        const armor = visibleItems.filter((item) => item.category === 'armor')[0];
        const wasOnIceTile = this.gameManagerService.onIceTile(activePlayer, game.id) ? true : false;

        if (armor) {
            await this.moveToTargetItem(activePlayer, visibleItems, wasOnIceTile, game);
            this.itemsManagerService.pickUpItem(armor.coordinate, game.id, activePlayer);
            activePlayer.specs.movePoints > 0
                ? await this.executeDefensiveBehavior(activePlayer, game)
                : this.emit(VirtualPlayerEvents.VirtualPlayerFinishedMoving, game.id);
        } else if (visiblePlayers.length > 0 && activePlayer.specs.actions > 0) {
            await this.moveToTargetPlayer(activePlayer, visiblePlayers, wasOnIceTile, game, possibleMoves);
        } else {
            const moved = await this.updateVirtualPlayerPosition(activePlayer, game.id);
            moved &&
                (activePlayer.specs.actions < 0 || activePlayer.specs.movePoints < 0
                    ? this.emit(VirtualPlayerEvents.VirtualPlayerFinishedMoving, game.id)
                    : Math.random() < CONTINUE_ODDS
                    ? await this.executeDefensiveBehavior(activePlayer, game)
                    : this.emit(VirtualPlayerEvents.VirtualPlayerFinishedMoving, game.id));
        }
    }

    getPlayersInArea(area: Coordinate[], players: Player[], activePlayer: Player): Player[] {
        const filteredPlayers = players.filter((player) => player !== activePlayer);
        return filteredPlayers.filter((player) =>
            area.some((coordinate) => coordinate.x === player.position.x && coordinate.y === player.position.y),
        );
    }

    getItemsInArea(area: Coordinate[], game: Game): Item[] {
        return game.items.filter((item) => area.some((coordinate) => coordinate.x === item.coordinate.x && coordinate.y === item.coordinate.y));
    }

    getAdjacentTiles(position: Coordinate): Coordinate[] {
        return [
            { x: position.x + 1, y: position.y },
            { x: position.x - 1, y: position.y },
            { x: position.x, y: position.y + 1 },
            { x: position.x, y: position.y - 1 },
        ];
    }

    getAdjacentTilesToPossibleMoves(possibleMoves: [string, { path: Coordinate[]; weight: number }][]): Coordinate[] {
        const allAdjacentTiles: Coordinate[] = [];
        for (const possibleMove of possibleMoves) {
            const adjacentTiles = this.getAdjacentTiles(possibleMove[1].path[possibleMove[1].path.length - 1]);
            allAdjacentTiles.push(...adjacentTiles);
        }
        return allAdjacentTiles;
    }

    async startCombat(combat: Combat, game: Game): Promise<boolean> {
        const sockets = await this.server.in(game.id).fetchSockets();
        const opponentSocket = sockets.find((socket) => socket.id === combat.opponent.socketId);

        if (combat.challenger.socketId.includes('virtual') && combat.opponent.socketId.includes('virtual')) {
            this.startRegularCombat(combat, game);
            return true;
        } else if (opponentSocket) {
            await opponentSocket.join(combat.id);
            this.startRegularCombat(combat, game);
            return true;
        }
        return false;
    }

    startRegularCombat(combat: Combat, game: Game): void {
        const involvedPlayers = [combat.challenger.name];
        this.journalService.logMessage(game.id, `${combat.challenger.name} a commencé un combat contre ${combat.opponent.name}.`, involvedPlayers);
        const combatStartedData: CombatStartedData = {
            challenger: combat.challenger,
            opponent: combat.opponent,
        };
        this.server.to(combat.id).emit(CombatEvents.CombatStarted, combatStartedData);
        this.server.to(game.id).emit(CombatEvents.CombatStartedSignal);
        this.gameManagerService.updatePlayerActions(game.id, combat.challenger.socketId);
        this.combatCountdownService.initCountdown(game.id, COUNTDOWN_COMBAT_DURATION);
        this.gameCountdownService.pauseCountdown(game.id);
        this.startCombatTurns(game.id);
    }

    handleVirtualPlayerCombat(player: Player, opponent: Player, gameId: string, combat: Combat): boolean {
        if (player.socketId.includes('virtual')) {
            if (player.profile === ProfileType.AGGRESSIVE) {
                this.handleAggressiveCombat(player, opponent, combat);
                return false;
            } else if (player.profile === ProfileType.DEFENSIVE) {
                return this.handleDefensiveCombat(player, opponent, combat, gameId);
            }
        }
    }

    handleAggressiveCombat(player: Player, opponent: Player, combat: Combat): void {
        this.attack(player, opponent, combat);
    }

    handleDefensiveCombat(player: Player, opponent: Player, combat: Combat, gameId: string): boolean {
        if (player.specs.evasions > 0) {
            if (player.specs.speed === MAXIMUM_BONUS && player.specs.life < MINIMUM_BONUS) {
                player.specs.evasions--;
                player.specs.nEvasions++;
                return this.attemptEvasion(player, opponent, combat, gameId);
            } else if (player.specs.speed === MINIMUM_BONUS && player.specs.life < MAXIMUM_BONUS) {
                player.specs.evasions--;
                player.specs.nEvasions++;
                return this.attemptEvasion(player, opponent, combat, gameId);
            }
        }
        this.attack(player, opponent, combat);
        return false;
    }

    attack(player: Player, opponent: Player, combat: Combat): void {
        const rollResult = this.combatService.rollDice(player, opponent);
        this.server.to(combat.id).emit(CombatEvents.DiceRolled, rollResult);
        this.journalService.logMessage(
            combat.id,
            `Dés roulés. Dé d'attaque: ${rollResult.attackDice}. Dé de défense: ${rollResult.defenseDice}. Résultat = ${rollResult.attackDice} - ${rollResult.defenseDice}.`,
            [player.name, opponent.name],
        );
        if (this.combatService.isAttackSuccess(player, opponent, rollResult)) {
            this.combatService.handleAttackSuccess(player, opponent, combat.id);
            this.journalService.logMessage(combat.id, `Réussite de l'attaque sur ${opponent.name}.`, [opponent.name]);
        } else {
            this.server.to(combat.id).emit(CombatEvents.AttackFailure, opponent);
            this.journalService.logMessage(combat.id, `Échec de l'attaque sur ${opponent.name}.`, [opponent.name]);
        }
    }

    attemptEvasion(player: Player, opponent: Player, combat: Combat, gameId: string): boolean {
        const evasionSuccess = Math.random() < EVASION_SUCCESS_RATE;
        if (evasionSuccess) {
            const game = this.gameCreationService.getGameById(gameId);
            this.combatService.updatePlayersInGame(game);
            this.server.to(combat.id).emit(CombatEvents.EvasionSuccess, player);
            this.journalService.logMessage(gameId, `Fin de combat. ${player.name} s'est évadé.`, [player.name]);
            this.combatCountdownService.deleteCountdown(gameId);
            return true;
        } else {
            this.server.to(combat.id).emit(CombatEvents.EvasionFailed, player);
            this.journalService.logMessage(combat.id, `Tentative d'évasion par ${player.name}: non réussie.`, [player.name]);
            return false;
        }
    }

    startCombatTurns(gameId: string): void {
        const combat = this.combatService.getCombatByGameId(gameId);
        const game = this.gameCreationService.getGameById(gameId);
        if (combat) {
            this.server.to(combat.currentTurnSocketId).emit(CombatEvents.YourTurnCombat);
            const currentPlayer = combat.currentTurnSocketId === combat.challenger.socketId ? combat.challenger : combat.opponent;
            const otherPlayer = combat.currentTurnSocketId === combat.challenger.socketId ? combat.opponent : combat.challenger;
            this.server.to(otherPlayer.socketId).emit(CombatEvents.PlayerTurnCombat);
            this.combatCountdownService.startTurnCounter(game, currentPlayer.specs.evasions === 0 ? false : true);
        }
    }

    async moveToTargetPlayer(
        activePlayer: Player,
        visiblePlayers: Player[],
        wasOnIceTile: boolean,
        game: Game,
        possibleMoves: [
            string,
            {
                path: Coordinate[];
                weight: number;
            },
        ][],
    ): Promise<void> {
        const randomPlayerIndex = Math.floor(Math.random() * visiblePlayers.length);
        const targetPlayer = visiblePlayers[randomPlayerIndex];
        const adjacentTiles = this.getAdjacentTiles(targetPlayer.position);
        const validMove = adjacentTiles.find((tile) =>
            possibleMoves.some((move) => move[1].path.some((pathTile) => pathTile.x === tile.x && pathTile.y === tile.y)),
        );
        const pathToTargetPlayer = this.gameManagerService.getMove(game.id, activePlayer.socketId, validMove);
        await this.updatePosition(activePlayer, pathToTargetPlayer, game.id, wasOnIceTile);
        if (this.gameManagerService.hasFallen) this.emit(VirtualPlayerEvents.VirtualPlayerFinishedMoving, game.id);
        const possibleOpponents = this.gameManagerService.getAdjacentPlayers(activePlayer, game.id);
        if (possibleOpponents.length > 0 && activePlayer.specs.actions > 0) {
            const opponent = possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)];
            const combat = this.combatService.createCombat(game.id, activePlayer, opponent);
            const combatStarted = await this.startCombat(combat, game);
            if (combatStarted) return;
        }
    }

    async moveToTargetItem(activePlayer: Player, visibleItems: Item[], wasOnIceTile: boolean, game: Game): Promise<void> {
        const randomItemIndex = Math.floor(Math.random() * visibleItems.length);
        const targetItem = visibleItems[randomItemIndex];
        const pathToTargetItem = this.gameManagerService.getMove(game.id, activePlayer.socketId, targetItem.coordinate);
        await this.updatePosition(activePlayer, pathToTargetItem, game.id, wasOnIceTile);
        if (this.gameManagerService.hasFallen) this.emit(VirtualPlayerEvents.VirtualPlayerFinishedMoving, game.id);
    }

    checkAndToggleDoor(player: Player, game: Game): void {
        const playerPosition = player.position;
        const adjacentTiles = this.getAdjacentTiles(playerPosition);
        const adjacentDoors = game.doorTiles.filter((door) =>
            adjacentTiles.some((tile) => tile.x === door.coordinate.x && tile.y === door.coordinate.y),
        );
        if (adjacentDoors.length > 0) {
            const selectedDoor = adjacentDoors[Math.floor(Math.random() * adjacentDoors.length)];
            selectedDoor.isOpened = !selectedDoor.isOpened;
            const playerInGame = game.players.find((p) => p.socketId === player.socketId);
            this.server.to(game.id).emit(ItemsEvents.DoorToggled, { game, player: playerInGame });
            this.journalService.logMessage(game.id, `Une porte a été ouverte par ${player.name}.`, [player.name]);
        }
    }
}
