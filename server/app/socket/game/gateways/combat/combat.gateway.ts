import { TIME_LIMIT_DELAY } from '@common/constants';
import { Player } from '@common/game';
import { Inject } from '@nestjs/common';
import { OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ServerCombatService } from '../../service/combat/combat.service';
import { CombatCountdownService } from '../../service/countdown/combat/combat-countdown.service';
import { GameCountdownService } from '../../service/countdown/game/game-countdown.service';
import { GameCreationService } from '../../service/game-creation/game-creation.service';
import { GameManagerService } from '../../service/game-manager/game-manager.service';
import { JournalService } from '../../service/journal/journal.service';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class CombatGateway implements OnGatewayInit, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    @Inject(GameCreationService) private gameCreationService: GameCreationService;
    @Inject(GameManagerService) private gameManagerService: GameManagerService;
    @Inject(JournalService) private journalService: JournalService;

    constructor(
        private serverCombatService: ServerCombatService,
        private gameCountdownService: GameCountdownService,
        private combatCountdownService: CombatCountdownService,
    ) {
        this.serverCombatService = serverCombatService;
        this.combatCountdownService = combatCountdownService;
        this.gameCountdownService = gameCountdownService;
    }

    afterInit() {
        this.combatCountdownService.setServer(this.server);
        this.combatCountdownService.on('timeout', (gameId: string) => {
            this.attackOnTimeOut(gameId);
        });
    }

    @SubscribeMessage('startCombat')
    async startCombat(client: Socket, data: { gameId: string; opponent: Player }): Promise<void> {
        const game = this.gameCreationService.getGameById(data.gameId);
        const player = this.gameCreationService.getPlayer(data.gameId, client.id);
        if (game) {
            const combat = this.serverCombatService.createCombat(data.gameId, player, data.opponent);
            await client.join(combat.id);
            const sockets = await this.server.in(data.gameId).fetchSockets();
            const opponentSocket = sockets.find((socket) => socket.id === data.opponent.socketId);
            if (opponentSocket) {
                await opponentSocket.join(combat.id);
                this.server.to(combat.id).emit('combatStarted', {
                    challenger: player,
                    opponent: data.opponent,
                });
                this.gameManagerService.updatePlayerActions(data.gameId, client.id);
                const involvedPlayers = [player.name];
                this.journalService.logMessage(data.gameId, `${player.name} a commencé un combat contre ${data.opponent.name}.`, involvedPlayers);

                this.server.to(data.gameId).emit('combatStartedSignal');
                this.server.to(client.id).emit('YouStartedCombat', player);
                this.combatCountdownService.initCountdown(data.gameId, 5);
                this.gameCountdownService.pauseCountdown(data.gameId);
                this.startCombatTurns(data.gameId);
            }
        }
    }

    @SubscribeMessage('attack')
    attack(client: Socket, gameId: string): void {
        this.attackOnTimeOut(gameId);
    }

    @SubscribeMessage('startEvasion')
    async startEvasion(client: Socket, gameId: string): Promise<void> {
        const combat = this.serverCombatService.getCombatByGameId(gameId);
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
                    this.serverCombatService.updatePlayersInGame(game);
                    this.server.to(combat.id).emit('evasionSuccess', evadingPlayer);
                    this.journalService.logMessage(gameId, `Fin de combat. ${evadingPlayer.name} s'est évadé.`, [evadingPlayer.name]);
                    this.combatCountdownService.deleteCountdown(gameId);
                    setTimeout(() => {
                        this.server.to(gameId).emit('combatFinishedByEvasion', { updatedGame: game, evadingPlayer: evadingPlayer });
                        this.gameCountdownService.resumeCountdown(gameId);
                        this.cleanupCombatRoom(combat.id);
                        this.serverCombatService.deleteCombat(gameId);
                    }, TIME_LIMIT_DELAY);
                } else {
                    this.server.to(combat.id).emit('evasionFailed', evadingPlayer);
                    this.prepareNextTurn(gameId);
                    this.journalService.logMessage(combat.id, `Tentative d'évasion par ${evadingPlayer.name}: non réussie.`, [evadingPlayer.name]);
                }
            }
        }
    }

    attackOnTimeOut(gameId: string) {
        const combat = this.serverCombatService.getCombatByGameId(gameId);
        if (combat) {
            const attackingPlayer: Player = combat.currentTurnSocketId === combat.challenger.socketId ? combat.challenger : combat.opponent;
            const defendingPlayer: Player = combat.currentTurnSocketId === combat.challenger.socketId ? combat.opponent : combat.challenger;

            const rollResult = this.serverCombatService.rollDice(attackingPlayer, defendingPlayer);
            this.server.to(combat.id).emit('diceRolled', {
                attackDice: rollResult.attackDice,
                defenseDice: rollResult.defenseDice,
            });
            this.journalService.logMessage(
                combat.id,
                `Dés roulés. Dé d'attaque: ${rollResult.attackDice}. Dé de défense: ${rollResult.defenseDice}. Résultat = ${rollResult.attackDice} - ${rollResult.defenseDice}.`,
                [attackingPlayer.name, defendingPlayer.name],
            );

            if (this.serverCombatService.isAttackSuccess(attackingPlayer, defendingPlayer, rollResult)) {
                defendingPlayer.specs.life--;
                defendingPlayer.specs.nLifeLost++;
                attackingPlayer.specs.nLifeTaken++;
                this.server.to(combat.id).emit('attackSuccess', defendingPlayer);
                this.journalService.logMessage(combat.id, `Réussite de l'attaque sur ${defendingPlayer.name}.`, [defendingPlayer.name]);
            } else {
                this.server.to(combat.id).emit('attackFailure', defendingPlayer);
                this.journalService.logMessage(combat.id, `Échec de l'attaque sur ${defendingPlayer.name}.`, [defendingPlayer.name]);
            }

            if (defendingPlayer.specs.life === 0) {
                const game = this.gameCreationService.getGameById(gameId);
                this.serverCombatService.combatWinStatsUpdate(attackingPlayer, gameId);
                this.serverCombatService.sendBackToInitPos(defendingPlayer, game);
                this.serverCombatService.updatePlayersInGame(game);

                this.server.to(combat.id).emit('combatFinishedNormally', attackingPlayer);

                this.journalService.logMessage(gameId, `Fin de combat. ${attackingPlayer.name} est le gagnant.`, [attackingPlayer.name]);
                this.combatCountdownService.deleteCountdown(gameId);
                setTimeout(() => {
                    this.server.to(gameId).emit('combatFinished', { updatedGame: game, winner: attackingPlayer });
                    if (this.checkForGameWinner(game.id, attackingPlayer)) {
                        return;
                    }
                    if (game.currentTurn === attackingPlayer.turn) {
                        this.gameCountdownService.resumeCountdown(gameId);
                    } else {
                        this.gameCountdownService.emit('timeout', gameId);
                    }
                    this.serverCombatService.deleteCombat(game.id);
                    this.cleanupCombatRoom(combat.id);
                }, TIME_LIMIT_DELAY);
            } else {
                this.combatCountdownService.resetTimerSubscription(gameId);
                this.prepareNextTurn(gameId);
            }
        }
    }

    checkForGameWinner(gameId: string, player: Player): boolean {
        if (player.specs.nVictories >= 3) {
            this.server.to(gameId).emit('gameFinishedPlayerWon', { winner: player });
            return true;
        }
        return false;
    }

    prepareNextTurn(gameId: string) {
        this.serverCombatService.updateTurn(gameId);
        this.combatCountdownService.resetTimerSubscription(gameId);
        this.startCombatTurns(gameId);
    }

    startCombatTurns(gameId: string): void {
        const combat = this.serverCombatService.getCombatByGameId(gameId);
        const game = this.gameCreationService.getGameById(gameId);
        if (combat) {
            this.server.to(combat.currentTurnSocketId).emit('yourTurnCombat');
            const currentPlayer = combat.currentTurnSocketId === combat.challenger.socketId ? combat.challenger : combat.opponent;
            const otherPlayer = combat.currentTurnSocketId === combat.challenger.socketId ? combat.opponent : combat.challenger;
            this.server.to(otherPlayer.socketId).emit('playerTurnCombat');
            this.combatCountdownService.startTurnCounter(game, currentPlayer.specs.evasions === 0 ? false : true);
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
                if (this.gameCreationService.isPlayerHost(client.id, game.id)) {
                    this.server.to(game.id).emit('gameClosed', { reason: "L'organisateur a quitté la partie" });
                    this.gameCreationService.deleteRoom(game.id);
                    return;
                }
            }
            const player = game.players.find((player) => player.socketId === client.id);
            if (player) {
                const updatedGame = this.gameCreationService.handlePlayerLeaving(client, game.id);
                this.server.to(updatedGame.id).emit('playerLeft', updatedGame.players);
                if (updatedGame.hasStarted) {
                    this.journalService.logMessage(game.id, `${player.name} a abandonné la partie.`, [player.name]);
                    const combat = this.serverCombatService.getCombatByGameId(updatedGame.id);
                    if (combat) {
                        (client.id === combat.challenger.socketId ? combat.challenger : combat.opponent).isActive = false;
                        const winner = client.id === combat.challenger.socketId ? combat.opponent : combat.challenger;
                        this.serverCombatService.combatWinStatsUpdate(winner, updatedGame.id);
                        this.serverCombatService.updatePlayersInGame(updatedGame);
                        this.server.to(combat.id).emit('combatFinishedByDisconnection', winner);
                        this.combatCountdownService.deleteCountdown(updatedGame.id);
                        setTimeout(() => {
                            this.server.to(updatedGame.id).emit('combatFinished', { updatedGame: updatedGame, winner: winner });
                            if (this.checkForGameWinner(updatedGame.id, winner)) {
                                return;
                            }
                            if (updatedGame.currentTurn === winner.turn) {
                                this.gameCountdownService.resumeCountdown(updatedGame.id);
                            } else {
                                this.gameCountdownService.emit('timeout', updatedGame.id);
                            }
                            this.cleanupCombatRoom(combat.id);
                        }, TIME_LIMIT_DELAY);
                    } else if (game.currentTurn === player.turn) {
                        this.gameCountdownService.emit('timeout', game.id);
                    }
                }
                return;
            }
        });
    }
}
