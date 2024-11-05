import { Player } from '@common/game';
import { Inject } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ServerCombatService } from '../../service/combat/combat.service';
import { CombatCountdownService } from '../../service/countdown/combat/combat-countdown.service';
import { GameCountdownService } from '../../service/countdown/game/game-countdown.service';
import { GameCreationService } from '../../service/game-creation/game-creation.service';
import { JournalService } from '../../service/journal/journal.service';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class CombatGateway implements OnGatewayInit {
    @WebSocketServer()
    server: Server;

    @Inject(GameCreationService) private gameCreationService: GameCreationService;
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
                const involvedPlayers = [player.name];
                this.journalService.logMessage(data.gameId, `${player.name} a commencé un combat contre ${data.opponent.name}.`, involvedPlayers);

                this.server.to(data.gameId).emit('combatStartedSignal');
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
            this.journalService.logMessage(gameId, `Fin de combat. ${evadingPlayer.name} s'est évadé.`, [evadingPlayer.name]);
            setTimeout(() => {
                this.server.to(gameId).emit('combatFinishedByEvasion', { updatedGame: game, evadingPlayer: evadingPlayer });
                this.combatCountdownService.deleteCountdown(gameId);
                this.gameCountdownService.resumeCountdown(gameId);
                this.cleanupCombatRoom(combat.id);
            }, 3000);
        } else {
            this.server.to(combat.id).emit('evasionFailed', evadingPlayer);
            this.prepareNextTurn(gameId);
            this.journalService.logMessage(combat.id, `Tentative d'évasion par ${evadingPlayer.name}: non réussie.`, [evadingPlayer.name]);
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
        this.journalService.logMessage(
            combat.id,
            `Dés roulés. Dé d'attaque: ${rollResult.attackDice}. Dé de défense: ${rollResult.defenseDice}. Résultat = ${rollResult.attackDice} - ${rollResult.defenseDice}.`,
            [attackingPlayer.name, defendingPlayer.name],
        );

        if (this.serverCombatService.isAttackSuccess(attackingPlayer, defendingPlayer, rollResult)) {
            defendingPlayer.specs.life--;
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
            setTimeout(() => {
                this.server.to(gameId).emit('combatFinished', { updatedGame: game, winner: attackingPlayer });
                this.combatCountdownService.deleteCountdown(gameId);
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
}
