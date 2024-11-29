import { Combat } from '@common/combat';
import { ProfileType, TIME_FOR_POSITION_UPDATE } from '@common/constants';
import { CombatEvents } from '@common/events/combat.events';
import { Game, Player } from '@common/game';
import { Coordinate, Item } from '@common/map.types';
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common/decorators/core/inject.decorator';
import { Server } from 'socket.io';
import { EventEmitter } from 'stream';
import { CombatService } from '../combat/combat.service';
import { CombatCountdownService } from '../countdown/combat/combat-countdown.service';
import { GameCountdownService } from '../countdown/game/game-countdown.service';
import { GameCreationService } from '../game-creation/game-creation.service';
import { GameManagerService } from '../game-manager/game-manager.service';
import { JournalService } from '../journal/journal.service';

@Injectable()
export class VirtualGameManagerService extends EventEmitter {
    @Inject(GameCreationService) private readonly gameCreationService: GameCreationService;
    @Inject(GameManagerService) private readonly gameManagerService: GameManagerService;
    @Inject(CombatService) private readonly combatService: CombatService;
    @Inject(JournalService) private readonly journalService: JournalService;
    @Inject(CombatCountdownService) private readonly combatCountdownService: CombatCountdownService;
    @Inject(GameCountdownService) private readonly gameCountdownService: GameCountdownService;
    server: Server;

    setServer(server: Server): void {
        this.server = server;
    }

    executeVirtualPlayerBehavior(player: Player, game: Game): void {
        if (player.profile === ProfileType.AGGRESSIVE) {
            this.executeAggressiveBehavior(player, game);
        } else if (player.profile === ProfileType.DEFENSIVE) {
            this.executeDefensiveBehavior(player, game);
        } else {
            this.updateVirtualPlayerPosition(player, game.id);
        }
        this.server.to(game.id).emit('moveVirtualPlayer', game);
    }

    calculateVirtualPlayerPath(player: Player, game: Game): Coordinate[] {
        const possibleMoves = this.gameManagerService.getMoves(game.id, player.socketId);

        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        randomMove[1].path[randomMove[1].path.length - 1];

        return randomMove[1].path;
    }

    async updateVirtualPlayerPosition(player: Player, gameId: string): Promise<void> {
        const game = this.gameCreationService.getGameById(gameId);
        let wasOnIceTile = false;
        if (this.gameManagerService.onIceTile(player, game.id)) wasOnIceTile = true;
        if (player) {
            const path = this.calculateVirtualPlayerPath(player, game);
            await this.updatePosition(player, path, game.id, wasOnIceTile);
        }
    }

    async updatePosition(player: Player, path: Coordinate[], gameId: string, wasOnIceTile: boolean) {
        const game = this.gameCreationService.getGameById(gameId);
        for (const move of path) {
            this.gameManagerService.updatePosition(game.id, player.socketId, [move]);
            wasOnIceTile = this.adaptSpecsForIceTileMove(player, gameId, wasOnIceTile);
            this.server.to(gameId).emit('positionToUpdate', { game: game, player: player });
            await new Promise((resolve) => setTimeout(resolve, TIME_FOR_POSITION_UPDATE));
            if (this.gameManagerService.checkForWinnerCtf(player, game.id)) {
                this.server.to(game.id).emit(CombatEvents.GameFinishedPlayerWon, player);
            }
        }
        player.position = path[path.length - 1];
    }

    adaptSpecsForIceTileMove(player: Player, gameId: string, wasOnIceTile: boolean) {
        const isOnIceTile = this.gameManagerService.onIceTile(player, gameId);
        if (isOnIceTile && !wasOnIceTile) {
            player.specs.attack -= 2;
            player.specs.defense -= 2;
            wasOnIceTile = true;
        } else if (!isOnIceTile && wasOnIceTile) {
            player.specs.attack += 2;
            player.specs.defense += 2;
            wasOnIceTile = false;
        }
        return wasOnIceTile;
    }

    async executeAggressiveBehavior(activePlayer: Player, game: Game): Promise<void> {
        const possibleMoves = this.gameManagerService.getMoves(game.id, activePlayer.socketId);
        const area = this.getAdjacentTilesToPossibleMoves(possibleMoves);

        const visiblePlayers = this.getPlayersInArea(area, game.players, activePlayer);
        const visibleItems = this.getItemsInArea(area, game);
        const sword = visibleItems.filter((item) => item.category === 'sword')[0];
        let wasOnIceTile = false;
        if (this.gameManagerService.onIceTile(activePlayer, game.id)) wasOnIceTile = true;

        if (visiblePlayers.length > 0) {
            const randomPlayerIndex = Math.floor(Math.random() * visiblePlayers.length);
            const targetPlayer = visiblePlayers[randomPlayerIndex];
            const adjacentTiles = this.getAdjacentTiles(targetPlayer.position);

            const validMove = adjacentTiles.find((tile) =>
                possibleMoves.some((move) => move[1].path.some((pathTile) => pathTile.x === tile.x && pathTile.y === tile.y)),
            );

            const pathToTargetPlayer = this.gameManagerService.getMove(game.id, activePlayer.socketId, validMove);

            await this.updatePosition(activePlayer, pathToTargetPlayer, game.id, wasOnIceTile);
            if (activePlayer.specs.actions > 0) {
                const possibleOpponents = this.gameManagerService.getAdjacentPlayers(activePlayer, game.id);
                if (possibleOpponents.length > 0) {
                    const opponent = possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)];
                    const combat = this.combatService.createCombat(game.id, activePlayer, opponent);
                    const combatStarted = await this.startCombat(combat, game);
                    if (combatStarted) return;
                }
            }
        } else if (sword) {
            await this.updatePosition(activePlayer, [sword.coordinate], game.id, wasOnIceTile);
            this.gameManagerService.pickUpItem(sword.coordinate, game, activePlayer);
        } else {
            this.updateVirtualPlayerPosition(activePlayer, game.id);
            if (activePlayer.specs.actions === 0) {
                this.emit('virtualPlayerFinishedMoving', game.id);
            } else {
                const shouldContinue = Math.random() < 0.4;
                if (shouldContinue) this.executeVirtualPlayerBehavior;
                else this.emit('virtualPlayerFinishedMoving', game.id);
            }
        }
    }

    async executeDefensiveBehavior(activePlayer: Player, game: Game): Promise<void> {
        const possibleMoves = this.gameManagerService.getMoves(game.id, activePlayer.socketId);
        const area = this.getAdjacentTilesToPossibleMoves(possibleMoves);

        const visiblePlayers = this.getPlayersInArea(area, game.players, activePlayer);
        const visibleItems = this.getItemsInArea(area, game);
        const armor = visibleItems.filter((item) => item.category === 'armor')[0];
        let wasOnIceTile = false;
        if (this.gameManagerService.onIceTile(activePlayer, game.id)) wasOnIceTile = true;

        if (armor) {
            await this.updatePosition(activePlayer, [armor.coordinate], game.id, wasOnIceTile);
            this.gameManagerService.pickUpItem(armor.coordinate, game, activePlayer);
        } else if (visiblePlayers.length > 0) {
            const randomIndex = Math.floor(Math.random() * visiblePlayers.length);
            const targetPlayer = visiblePlayers[randomIndex];
            const adjacentTiles = this.getAdjacentTiles(targetPlayer.position);
            const validMove = adjacentTiles.find((tile) =>
                possibleMoves.some((move) => move[1].path.some((pathTile) => pathTile.x === tile.x && pathTile.y === tile.y)),
            );

            const pathToTargetPlayer = this.gameManagerService.getMove(game.id, activePlayer.socketId, validMove);

            await this.updatePosition(activePlayer, pathToTargetPlayer, game.id, wasOnIceTile);
            if (activePlayer.specs.actions > 0) {
                const possibleOpponents = this.gameManagerService.getAdjacentPlayers(activePlayer, game.id);
                if (possibleOpponents.length > 0) {
                    const opponent = possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)];
                    const combat = this.combatService.createCombat(game.id, activePlayer, opponent);
                    const combatStarted = await this.startCombat(combat, game);
                    if (combatStarted) return;
                }
            }
        } else {
            this.updateVirtualPlayerPosition(activePlayer, game.id);
            if (activePlayer.specs.actions === 0) {
                this.emit('virtualPlayerFinishedMoving', game.id);
            } else {
                const shouldContinue = Math.random() < 0.4;
                if (shouldContinue) this.executeVirtualPlayerBehavior;
                else this.emit('virtualPlayerFinishedMoving', game.id);
            }
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
        if (opponentSocket) {
            await opponentSocket.join(combat.id);
            this.server.to(combat.id).emit('combatStarted', {
                challenger: combat.challenger,
                opponent: combat.opponent,
            });
            this.gameManagerService.updatePlayerActions(game.id, combat.challenger.socketId);
            const involvedPlayers = [combat.challenger.name];
            this.journalService.logMessage(
                game.id,
                `${combat.challenger.name} a commencé un combat contre ${combat.opponent.name}.`,
                involvedPlayers,
            );
            this.server.to(game.id).emit('combatStartedSignal');

            this.combatCountdownService.initCountdown(game.id, 5);
            this.gameCountdownService.pauseCountdown(game.id);
            this.startCombatTurns(game.id);
            return true;
        }
        return false;
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
            if (player.specs.speed === 6 && player.specs.life < 4) {
                player.specs.evasions--;
                player.specs.nEvasions++;
                return this.attemptEvasion(player, opponent, combat, gameId);
            } else if (player.specs.speed === 4 && player.specs.life < 6) {
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
        const evasionSuccess = Math.random() < 0.4;
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
}
