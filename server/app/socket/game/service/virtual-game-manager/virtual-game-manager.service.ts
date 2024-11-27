import { Combat } from '@common/combat';
import { ProfileType, TIME_LIMIT_DELAY } from '@common/constants';
import { CombatEvents, CombatFinishedByEvasionData } from '@common/events/combat.events';
import { Game, Player } from '@common/game';
import { Coordinate, Item } from '@common/map.types';
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common/decorators/core/inject.decorator';
import { Server } from 'socket.io';
import { EventEmitter } from 'stream';
import { CombatGateway } from '../../gateways/combat/combat.gateway';
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
    @Inject(CombatGateway) private readonly combatGateway: CombatGateway;
    @Inject(JournalService) private readonly journalService: JournalService;
    @Inject(CombatCountdownService) private readonly combatCountdownService: CombatCountdownService;
    @Inject(GameCountdownService) private readonly gameCountdownService: GameCountdownService;
    server: Server;

    setServer(server: Server): void {
        this.server = server;
    }

    executeVirtualPlayerBehavior(player: Player, game: Game): void {
        if (player.profile === ProfileType.AGGRESSIVE) {
            console.log('SelectedProfile:', player.profile);
            this.executeAggressiveBehavior(player, game);
        } else if (player.profile === ProfileType.DEFENSIVE) {
            console.log('SelectedProfile:', player.profile);
            this.executeDefensiveBehavior(player, game);
        } else {
            console.log('inside the else');
            this.updateVirtualPlayerPosition(player, game.id);
        }
        this.server.to(game.id).emit('moveVirtualPlayer', game);
    }

    calculateVirtualPlayerPath(player: Player, game: Game): Coordinate[] {
        const currentPos = player.position;
        const possibleMoves = this.gameManagerService.getMoves(game.id, player.socketId);

        let newPos: Coordinate;

        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        newPos = randomMove[1].path[randomMove[1].path.length - 1];

        return [currentPos, newPos];
    }

    updateVirtualPlayerPosition(player: Player, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        if (player) {
            const path = this.calculateVirtualPlayerPath(player, game);
            this.gameManagerService.updatePlayerPosition(player, path, game);
        }
    }

    async executeAggressiveBehavior(activePlayer: Player, game: Game): Promise<void> {
        const possibleMoves = this.gameManagerService.getMoves(game.id, activePlayer.socketId);
        const area = this.getAdjacentTilesToPossibleMoves(possibleMoves);

        const visiblePlayers = this.getPlayersInArea(area, game.players, activePlayer);
        const visibleItems = this.getItemsInArea(area, game);
        const sword = visibleItems.filter((item) => item.category === 'sword')[0];

        if (visiblePlayers.length > 0) {
            const randomIndex = Math.floor(Math.random() * visiblePlayers.length);
            const targetPlayer = visiblePlayers[randomIndex];
            const adjacentTiles = this.getAdjacentTiles(targetPlayer.position);
            this.gameManagerService.updatePlayerPosition(activePlayer, adjacentTiles, game);
            const possibleOpponents = this.gameManagerService.getAdjacentPlayers(activePlayer, game.id);
            if (possibleOpponents.length > 0) {
                const opponent = possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)];
                const combat = this.combatService.createCombat(game.id, activePlayer, opponent);
                const combatStarted = await this.startCombat(combat, game);
                if (combatStarted) return;
            }
        } else if (sword) {
            this.gameManagerService.updatePlayerPosition(activePlayer, [sword.coordinate], game);
            this.gameManagerService.pickUpItem(sword.coordinate, game, activePlayer);
        } else {
            this.updateVirtualPlayerPosition(activePlayer, game.id);
        }
    }

    async executeDefensiveBehavior(activePlayer: Player, game: Game): Promise<void> {
        const possibleMoves = this.gameManagerService.getMoves(game.id, activePlayer.socketId);
        const area = this.getAdjacentTilesToPossibleMoves(possibleMoves);

        const visiblePlayers = this.getPlayersInArea(area, game.players, activePlayer);
        const visibleItems = this.getItemsInArea(area, game);
        const armor = visibleItems.filter((item) => item.category === 'armor')[0];

        if (armor) {
            this.gameManagerService.updatePlayerPosition(activePlayer, [armor.coordinate], game);
            this.gameManagerService.pickUpItem(armor.coordinate, game, activePlayer);
        } else if (visiblePlayers.length > 0) {
            const randomIndex = Math.floor(Math.random() * visiblePlayers.length);
            const targetPlayer = visiblePlayers[randomIndex];
            const adjacentTiles = this.getAdjacentTiles(targetPlayer.position);
            this.gameManagerService.updatePlayerPosition(activePlayer, adjacentTiles, game);
            const possibleOpponents = this.gameManagerService.getAdjacentPlayers(activePlayer, game.id);
            if (possibleOpponents.length > 0) {
                const opponent = possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)];
                const combat = this.combatService.createCombat(game.id, activePlayer, opponent);
                const combatStarted = await this.startCombat(combat, game);
                if (combatStarted) return;
            }
        } else {
            this.updateVirtualPlayerPosition(activePlayer, game.id);
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

    handleVirtualPlayerCombat(player: Player, opponent: Player, gameId: string, combat: Combat): void {
        if (player.socketId.includes('virtual')) {
            if (player.profile === ProfileType.AGGRESSIVE) {
                return this.handleAggressiveCombat(player, opponent, combat, gameId);
            } else if (player.profile === ProfileType.DEFENSIVE) {
                return this.handleDefensiveCombat(player, opponent, combat, gameId);
            }
        }
    }

    handleAggressiveCombat(player: Player, opponent: Player, combat: Combat, gameId: string): void {
        return this.attack(player, opponent, combat, gameId);
    }

    handleDefensiveCombat(player: Player, opponent: Player, combat: Combat, gameId: string): void {
        if (player.specs.evasions > 0) {
            player.specs.evasions--;
            player.specs.nEvasions++;
            this.attemptEvasion(player, opponent, combat, gameId);
        }
        return this.attack(player, opponent, combat, gameId);
    }

    attack(player: Player, opponent: Player, combat: Combat, gameId: string): void {
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

        if (opponent.specs.life === 0) {
            this.combatGateway.handleCombatLost(opponent, player, gameId, combat.id);
        } else {
            this.combatCountdownService.resetTimerSubscription(gameId);
            this.combatGateway.prepareNextTurn(gameId);
        }
    }

    attemptEvasion(player: Player, opponent: Player, combat: Combat, gameId: string): void {
        const evasionSuccess = Math.random() < 0.4;
        if (evasionSuccess) {
            const game = this.gameCreationService.getGameById(gameId);
            this.combatService.updatePlayersInGame(game);
            this.server.to(combat.id).emit(CombatEvents.EvasionSuccess, player);
            this.journalService.logMessage(gameId, `Fin de combat. ${player.name} s'est évadé.`, [player.name]);
            this.combatCountdownService.deleteCountdown(gameId);
            setTimeout(() => {
                const combatFinishedByEvasionData: CombatFinishedByEvasionData = { updatedGame: game, evadingPlayer: player };
                this.server.to(gameId).emit(CombatEvents.CombatFinishedByEvasion, combatFinishedByEvasionData);
                this.gameCountdownService.resumeCountdown(gameId);
                this.combatGateway.cleanupCombatRoom(combat.id);
                this.combatService.deleteCombat(gameId);
            }, TIME_LIMIT_DELAY);
        } else {
            this.server.to(combat.id).emit(CombatEvents.EvasionFailed, player);
            this.combatGateway.prepareNextTurn(gameId);
            this.journalService.logMessage(combat.id, `Tentative d'évasion par ${player.name}: non réussie.`, [player.name]);
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
            this.handleVirtualPlayerCombat(currentPlayer, otherPlayer, gameId, combat);
        }
    }
}
