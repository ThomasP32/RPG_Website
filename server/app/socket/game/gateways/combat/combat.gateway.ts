import { Combat } from '@common/combat';
import { TIME_LIMIT_DELAY } from '@common/constants';
import { CombatEvents, CombatFinishedByEvasionData, CombatFinishedData, CombatStartedData, StartCombatData } from '@common/events/combat.events';
import { GameCreationEvents } from '@common/events/game-creation.events';
import { Game, Player } from '@common/game';
import { Inject } from '@nestjs/common';
import { OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CombatService } from '../../service/combat/combat.service';
import { CombatCountdownService } from '../../service/countdown/combat/combat-countdown.service';
import { GameCountdownService } from '../../service/countdown/game/game-countdown.service';
import { GameCreationService } from '../../service/game-creation/game-creation.service';
import { GameManagerService } from '../../service/game-manager/game-manager.service';
import { JournalService } from '../../service/journal/journal.service';
import { VirtualGameManagerService } from '../../service/virtual-game-manager/virtual-game-manager.service';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class CombatGateway implements OnGatewayInit, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    @Inject(GameCreationService) private readonly gameCreationService: GameCreationService;
    @Inject(GameManagerService) private readonly gameManagerService: GameManagerService;
    @Inject(JournalService) private readonly journalService: JournalService;
    @Inject(VirtualGameManagerService) private readonly virtualGameManager: VirtualGameManagerService;

    constructor(
        private readonly combatService: CombatService,
        private readonly gameCountdownService: GameCountdownService,
        private readonly combatCountdownService: CombatCountdownService,
    ) {
        this.combatService = combatService;
        this.combatCountdownService = combatCountdownService;
        this.gameCountdownService = gameCountdownService;
    }

    afterInit() {
        this.combatCountdownService.setServer(this.server);
        this.combatService.setServer(this.server);
        this.combatCountdownService.on('timeout', (gameId: string) => {
            this.attackOnTimeOut(gameId);
        });
    }

    @SubscribeMessage(CombatEvents.StartCombat)
    async startCombat(client: Socket, data: StartCombatData): Promise<void> {
        const game = this.gameCreationService.getGameById(data.gameId);
        const player = game.players.find((player) => player.turn === game.currentTurn);
        if (game) {
            console.log('un joueur essaie de commencer un combat contre', data.opponent.name);
            const combat = this.combatService.createCombat(data.gameId, player, data.opponent);
            await client.join(combat.id);
            let opponentSocket;
            if (data.opponent.socketId.includes('virtual')) {
                opponentSocket = data.opponent.socketId;
            } else {
                const sockets = await this.server.in(data.gameId).fetchSockets();
                opponentSocket = sockets.find((socket) => socket.id === data.opponent.socketId);
                if (opponentSocket) {
                    await opponentSocket.join(combat.id);
                }
            }
            if (opponentSocket) {
                console.log('un joueur a reussi de commencer un combat contre', opponentSocket);
                const combatStartedData: CombatStartedData = {
                    challenger: player,
                    opponent: data.opponent,
                };
                this.server.to(combat.id).emit(CombatEvents.CombatStarted, combatStartedData);
                this.gameManagerService.updatePlayerActions(data.gameId, client.id);
                const involvedPlayers = [player.name];
                this.journalService.logMessage(data.gameId, `${player.name} a commencé un combat contre ${data.opponent.name}.`, involvedPlayers);

                this.server.to(data.gameId).emit(CombatEvents.CombatStartedSignal);
                this.server.to(client.id).emit(CombatEvents.YouStartedCombat, player);
                this.combatCountdownService.initCountdown(data.gameId, 5);
                this.gameCountdownService.pauseCountdown(data.gameId);
                this.startCombatTurns(data.gameId);
            }
        }
    }

    @SubscribeMessage(CombatEvents.Attack)
    attack(client: Socket, gameId: string): void {
        this.attackOnTimeOut(gameId);
    }

    @SubscribeMessage(CombatEvents.StartEvasion)
    async startEvasion(client: Socket, gameId: string): Promise<void> {
        const combat = this.combatService.getCombatByGameId(gameId);
        if (combat) {
            if (client.id === combat.currentTurnSocketId) {
                const evadingPlayer: Player = combat.challenger.socketId === client.id ? combat.challenger : combat.opponent;
                if (evadingPlayer.specs.evasions === 0) {
                    return;
                }
                evadingPlayer.specs.nEvasions++;
                evadingPlayer.specs.evasions--;
                const evasionSuccess = Math.random() < 0.4;
                if (evasionSuccess) {
                    const game = this.gameCreationService.getGameById(gameId);
                    this.combatService.updatePlayersInGame(game);
                    this.server.to(combat.id).emit(CombatEvents.EvasionSuccess, evadingPlayer);
                    this.journalService.logMessage(gameId, `Fin de combat. ${evadingPlayer.name} s'est évadé.`, [evadingPlayer.name]);
                    this.combatCountdownService.deleteCountdown(gameId);
                    setTimeout(() => {
                        const combatFinishedByEvasionData: CombatFinishedByEvasionData = { updatedGame: game, evadingPlayer: evadingPlayer };
                        this.server.to(gameId).emit(CombatEvents.CombatFinishedByEvasion, combatFinishedByEvasionData);
                        this.gameCountdownService.resumeCountdown(gameId);
                        this.cleanupCombatRoom(combat.id);
                        this.combatService.deleteCombat(gameId);
                    }, TIME_LIMIT_DELAY);
                } else {
                    this.server.to(combat.id).emit(CombatEvents.EvasionFailed, evadingPlayer);
                    this.prepareNextTurn(gameId);
                    this.journalService.logMessage(combat.id, `Tentative d'évasion par ${evadingPlayer.name}: non réussie.`, [evadingPlayer.name]);
                }
            }
        }
    }

    attackOnTimeOut(gameId: string) {
        const combat = this.combatService.getCombatByGameId(gameId);
        if (combat) {
            const attackingPlayer: Player = combat.currentTurnSocketId === combat.challenger.socketId ? combat.challenger : combat.opponent;
            const defendingPlayer: Player = combat.currentTurnSocketId === combat.challenger.socketId ? combat.opponent : combat.challenger;

            const rollResult = this.combatService.rollDice(attackingPlayer, defendingPlayer);
            this.server.to(combat.id).emit(CombatEvents.DiceRolled, rollResult);
            this.journalService.logMessage(
                combat.id,
                `Dés roulés. Dé d'attaque: ${rollResult.attackDice}. Dé de défense: ${rollResult.defenseDice}. Résultat = ${rollResult.attackDice} - ${rollResult.defenseDice}.`,
                [attackingPlayer.name, defendingPlayer.name],
            );

            if (this.combatService.isAttackSuccess(attackingPlayer, defendingPlayer, rollResult)) {
                this.combatService.handleAttackSuccess(attackingPlayer, defendingPlayer, combat.id);
                this.journalService.logMessage(combat.id, `Réussite de l'attaque sur ${defendingPlayer.name}.`, [defendingPlayer.name]);
            } else {
                this.server.to(combat.id).emit(CombatEvents.AttackFailure, defendingPlayer);
                this.journalService.logMessage(combat.id, `Échec de l'attaque sur ${defendingPlayer.name}.`, [defendingPlayer.name]);
            }

            if (defendingPlayer.specs.life === 0) {
                this.handleCombatLost(defendingPlayer, attackingPlayer, gameId, combat.id);
            } else {
                this.combatCountdownService.resetTimerSubscription(gameId);
                this.prepareNextTurn(gameId);
            }
        }
    }

    handleCombatLost(defendingPlayer: Player, attackingPlayer: Player, gameId: string, combatId: string) {
        const game = this.gameCreationService.getGameById(gameId);
        this.combatService.combatWinStatsUpdate(attackingPlayer, gameId);
        this.combatService.sendBackToInitPos(defendingPlayer, game);
        this.combatService.updatePlayersInGame(game);

        this.server.to(combatId).emit(CombatEvents.CombatFinishedNormally, attackingPlayer);

        this.journalService.logMessage(gameId, `Fin de combat. ${attackingPlayer.name} est le gagnant.`, [attackingPlayer.name]);
        this.combatCountdownService.deleteCountdown(gameId);
        setTimeout(() => {
            const combatFinishedData: CombatFinishedData = { updatedGame: game, winner: attackingPlayer };
            this.server.to(gameId).emit(CombatEvents.CombatFinished, combatFinishedData);
            if (this.combatService.checkForGameWinner(game.id, attackingPlayer)) {
                this.server.to(gameId).emit(CombatEvents.GameFinishedPlayerWon, attackingPlayer);
                return;
            }
            if (game.currentTurn === attackingPlayer.turn) {
                this.gameCountdownService.resumeCountdown(gameId);
                this.server.to(attackingPlayer.socketId).emit(CombatEvents.ResumeTurnAfterCombatWin);
            } else {
                this.gameCountdownService.emit('timeout', gameId);
            }
            this.combatService.deleteCombat(game.id);
            this.cleanupCombatRoom(combatId);
        }, TIME_LIMIT_DELAY);
    }

    prepareNextTurn(gameId: string) {
        this.combatService.updateTurn(gameId);
        this.combatCountdownService.resetTimerSubscription(gameId);
        this.startCombatTurns(gameId);
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

            if (combat.currentTurnSocketId.includes('virtual')) {
                setTimeout(() => {
                    const isCombatFinishedByEvasion = this.virtualGameManager.handleVirtualPlayerCombat(currentPlayer, otherPlayer, game.id, combat);
                    if (otherPlayer.specs.life === 0) {
                        this.handleCombatLost(otherPlayer, currentPlayer, game.id, combat.id);
                    } else if (isCombatFinishedByEvasion) {
                        setTimeout(() => {
                            const combatFinishedByEvasionData: CombatFinishedByEvasionData = { updatedGame: game, evadingPlayer: currentPlayer };
                            this.server.to(gameId).emit(CombatEvents.CombatFinishedByEvasion, combatFinishedByEvasionData);
                            this.gameCountdownService.resumeCountdown(gameId);
                            this.cleanupCombatRoom(combat.id);
                            this.combatService.deleteCombat(gameId);
                            if (this.gameCreationService.getGameById(gameId).currentTurn === currentPlayer.turn) {
                                this.virtualGameManager.executeVirtualPlayerBehavior(currentPlayer, game);
                            }
                        }, TIME_LIMIT_DELAY);
                    } else {
                        this.combatCountdownService.resetTimerSubscription(gameId);
                        this.prepareNextTurn(gameId);
                    }
                }, 3000);
            }
        }
    }

    async cleanupCombatRoom(combatRoomId: string): Promise<void> {
        const sockets = await this.server.in(combatRoomId).fetchSockets();
        for (const socketId of sockets) {
            socketId.leave(combatRoomId);
        }
    }

    handleDisconnect(client: Socket): void {
        const games = this.gameCreationService.getGames();

        games.forEach((game) => {
            if (!game.hasStarted) {
                if (this.handleHostDisconnection(client, game)) {
                    return;
                }
            }

            const player = game.players.find((player) => player.socketId === client.id);
            if (player) {
                this.handlePlayerDisconnection(client, game, player);
            }
        });
    }

    private handleHostDisconnection(client: Socket, game: Game): boolean {
        if (this.gameCreationService.isPlayerHost(client.id, game.id)) {
            this.server.to(game.id).emit(GameCreationEvents.GameClosed);
            this.gameCreationService.deleteRoom(game.id);
            return true;
        }
        return false;
    }

    private handlePlayerDisconnection(client: Socket, game: Game, player: Player): void {
        const updatedGame = this.gameCreationService.handlePlayerLeaving(client, game.id);
        this.server.to(updatedGame.id).emit(GameCreationEvents.PlayerLeft, updatedGame.players);

        if (updatedGame.hasStarted) {
            this.journalService.logMessage(game.id, `${player.name} a abandonné la partie.`, [player.name]);

            const combat = this.combatService.getCombatByGameId(updatedGame.id);
            if (combat) {
                this.handleCombatDisconnection(client, updatedGame, combat);
            } else if (game.currentTurn === player.turn) {
                this.gameCountdownService.emit('timeout', game.id);
            }
        }
    }

    private handleCombatDisconnection(client: Socket, updatedGame: Game, combat: Combat): void {
        const disconnectedPlayer = client.id === combat.challenger.socketId ? combat.challenger : combat.opponent;
        const winner = client.id === combat.challenger.socketId ? combat.opponent : combat.challenger;
        disconnectedPlayer.isActive = false;

        this.combatService.combatWinStatsUpdate(winner, updatedGame.id);
        this.combatService.updatePlayersInGame(updatedGame);
        this.server.to(combat.id).emit(CombatEvents.CombatFinishedByDisconnection, winner);
        this.combatCountdownService.deleteCountdown(updatedGame.id);

        setTimeout(() => {
            const combatFinishedData: CombatFinishedData = { updatedGame: updatedGame, winner: winner };
            this.server.to(updatedGame.id).emit(CombatEvents.CombatFinished, combatFinishedData);

            if (this.combatService.checkForGameWinner(updatedGame.id, winner)) {
                this.server.to(updatedGame.id).emit(CombatEvents.GameFinishedPlayerWon, winner);
                return;
            }

            if (updatedGame.currentTurn === winner.turn) {
                this.gameCountdownService.resumeCountdown(updatedGame.id);
            } else {
                this.gameCountdownService.emit('timeout', updatedGame.id);
            }

            this.cleanupCombatRoom(combat.id);
        }, TIME_LIMIT_DELAY);
    }
}
