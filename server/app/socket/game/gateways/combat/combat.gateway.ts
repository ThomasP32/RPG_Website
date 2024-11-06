import { Game, Player } from '@common/game';
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
        let evadingPlayer: Player;
        if (combat.challenger.socketId === client.id) {
            if (combat.challenger.specs.evasions === 0) return;
            else {
                evadingPlayer = combat.challenger;
                combat.challenger.specs.evasions--;
                combat.challenger.specs.nEvasions++;
            }
        } else {
            if (combat.opponent.specs.evasions === 0) return;
            else {
                evadingPlayer = combat.opponent;
                combat.opponent.specs.evasions--;
                combat.challenger.specs.nEvasions++;
            }
        }
        const evasionSuccess = Math.random() < 0.4;
        if (evasionSuccess) {
            combat.challenger.specs.life = combat.challengerLife;
            combat.opponent.specs.life = combat.opponentLife;
            combat.challenger.specs.nCombats++;
            combat.opponent.specs.nCombats++;
            const game = this.gameCreationService.getGameById(gameId);
            this.serverCombatService.updatePlayersInGame(game);
            this.server.to(combat.id).emit('evasionSuccess', evadingPlayer);
            setTimeout(() => {
                this.server.to(gameId).emit('combatFinishedByEvasion', { updatedGame: game, evadingPlayer: evadingPlayer });
                this.combatCountdownService.deleteCountdown(gameId);
                this.gameCountdownService.resumeCountdown(gameId);
                this.cleanupCombatRoom(combat.id);
            }, 3000);
        } else {
            this.server.to(combat.id).emit('evasionFailed', evadingPlayer);
            this.prepareNextTurn(gameId);
        }
    }

    attackOnTimeOut(gameId: string) {
        const combat = this.serverCombatService.getCombatByGameId(gameId);
        let attackingPlayer: Player;
        let defendingPlayer: Player;
        if (combat.currentTurnSocketId === combat.challenger.socketId) {
            attackingPlayer = combat.challenger;
            defendingPlayer = combat.opponent;
        } else {
            attackingPlayer = combat.opponent;
            defendingPlayer = combat.challenger;
        }
        const rollResult = this.serverCombatService.rollDice(attackingPlayer, defendingPlayer);
        this.server.to(combat.id).emit('diceRolled', {
            attackDice: rollResult.attackDice,
            defenseDice: rollResult.defenseDice,
        });

        if (this.serverCombatService.isAttackSuccess(attackingPlayer, defendingPlayer, rollResult)) {
            defendingPlayer.specs.life--;
            this.server.to(combat.id).emit('attackSuccess', defendingPlayer);
        } else {
            this.server.to(combat.id).emit('attackFailure', defendingPlayer);
        }

        if (defendingPlayer.specs.life === 0) {
            const game = this.gameCreationService.getGameById(gameId);
            this.serverCombatService.combatWinStatsUpdate(attackingPlayer, gameId);
            this.serverCombatService.sendBackToInitPos(defendingPlayer, game);
            this.serverCombatService.updatePlayersInGame(game);
            this.server.to(combat.id).emit('combatFinishedNormally', attackingPlayer);
            setTimeout(() => {
                this.server.to(gameId).emit('combatFinished', { updatedGame: game, winner: attackingPlayer });
                if (this.checkForWinner(game.id, attackingPlayer)) {
                    this.combatCountdownService.deleteCountdown(gameId);
                    return;
                }
                if (game.currentTurn === attackingPlayer.turn) {
                    this.gameCountdownService.resumeCountdown(gameId);
                } else {
                    this.gameCountdownService.emit('timeout', gameId);
                }
                this.cleanupCombatRoom(combat.id);
            }, 3000);
        } else {
            this.combatCountdownService.resetTimerSubscription(gameId);
            this.prepareNextTurn(gameId);
        }
    }

    checkForWinner(gameId: string, player: Player): boolean {
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
        let currentPlayerTurn: Player;
        this.server.to(combat.currentTurnSocketId).emit('yourTurnCombat');
        if (combat.currentTurnSocketId === combat.challenger.socketId) {
            currentPlayerTurn = combat.challenger;
            this.server.to(combat.opponent.socketId).emit('playerTurnCombat');
        } else {
            currentPlayerTurn = combat.opponent;
            this.server.to(combat.challenger.socketId).emit('playerTurnCombat');
        }
        this.combatCountdownService.startTurnCounter(gameId, currentPlayerTurn.specs.evasions === 0 ? false : true);
    }

    async cleanupCombatRoom(combatRoomId: string): Promise<void> {
        try {
            const sockets = await this.server.in(combatRoomId).fetchSockets();
            for (const socketId of sockets) {
                socketId.leave(combatRoomId);
            }
        } catch (error) {
            console.error(`Error while cleaning up combat room: ${combatRoomId}:`, error);
        }
    }

    handleDisconnect(client: Socket): void {
        let playerGame: Game | undefined;

        const games = this.gameCreationService.getGames();
        games.forEach((game) => {
            if (game.players.some((player) => player.socketId === client.id)) {
                playerGame = game;
                return;
            }
        });
        if (playerGame) {
            this.gameCreationService.handlePlayerLeaving(client, playerGame.id);
            const combat = this.serverCombatService.getCombatByGameId(playerGame.id);

            if (combat) {
                const winner = client.id === combat.challenger.socketId ? combat.opponent : combat.challenger;
                this.server.to(playerGame.id).emit('playerLeft', playerGame.players);
                this.serverCombatService.combatWinStatsUpdate(winner, combat.id);
                const updatedGame = this.gameCreationService.getGameById(playerGame.id);
                this.serverCombatService.updatePlayersInGame(updatedGame);
                this.server.to(combat.id).emit('combatFinishedByDisconnection', winner);

                setTimeout(() => {
                    this.server.to(playerGame.id).emit('combatFinished', { updatedGame: updatedGame, winner: winner });
                    if (this.checkForWinner(playerGame.id, winner)) {
                        this.combatCountdownService.deleteCountdown(playerGame.id);
                        return;
                    }

                    if (updatedGame.currentTurn === winner.turn) {
                        this.gameCountdownService.resumeCountdown(playerGame.id);
                    } else {
                        this.gameCountdownService.emit('timeout', playerGame.id);
                    }
                    this.cleanupCombatRoom(combat.id);
                }, 3000);
            }
        }
    }
}
