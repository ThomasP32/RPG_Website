import { Player } from '@common/game';
import { Inject } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ServerCombatService } from '../../service/combat/combat.service';
import { CombatCountdownService } from '../../service/countdown/combat/combat-countdown.service';
import { GameCountdownService } from '../../service/countdown/game/game-countdown.service';
import { GameCreationService } from '../../service/game-creation/game-creation.service';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class CombatGateway implements OnGatewayInit {
    @WebSocketServer()
    server: Server;

    @Inject(GameCreationService) private gameCreationService: GameCreationService;

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
            console.log(combat);
            await client.join(combat.id);
            const sockets = await this.server.in(data.gameId).fetchSockets();
            const opponentSocket = sockets.find((socket) => socket.id === data.opponent.socketId);
            if (opponentSocket) {
                await opponentSocket.join(combat.id);
            }
            this.server.to(combat.id).emit('combatStarted', {
                message: `${player.name} a commencé un combat contre ${data.opponent.name}`,
                combatRoomId: combat.id,
                challenger: player,
                opponent: data.opponent,
            });
            this.server.to(data.gameId).emit('combatStarted');
            this.combatCountdownService.initCountdown(data.gameId, 5);
            this.gameCountdownService.pauseCountdown(data.gameId);
            this.startCombatTurns(data.gameId);
        }
    }

    attackOnTimeOut(gameId: string) {
        console.log('Attaque automatique commencée');
        const combat = this.serverCombatService.getCombatByGameId(gameId);
        if (combat.currentTurnSocketId === combat.challenger.socketId) {
            const rollResult = this.serverCombatService.rollDice(combat.challenger, combat.opponent);
            this.server.to(combat.id).emit('diceRolled', {
                playerDiceAttack: rollResult.attackingPlayerAttackDice,
                playerDiceDefense: rollResult.attackingPlayerDefenseDice,
                opponentDiceAttack: rollResult.opponentAttackDice,
                opponentDiceDefense: rollResult.opponentDefenseDice,
                attackDice: rollResult.attackDice,
                defenseDice: rollResult.defenseDice,
            });
            if (this.serverCombatService.isAttackSuccess(combat.challenger, combat.opponent, rollResult.attackDice, rollResult.defenseDice)) {
                combat.opponent.specs.life--;
                console.log('combat.opponent.specs.life', combat.opponent.specs.life);
                this.server.to(combat.id).emit('attackSuccess', {
                    attacker: combat.challenger,
                    playerAttacked: combat.opponent,
                    message: `Attaque réussie de ${combat.challenger.name}`,
                });
                if (combat.opponent.specs.life === 0) {
                    this.serverCombatService.combatWinStatsUpdate(combat.challenger, combat.opponent);
                    combat.challenger.specs.life = combat.challengerLife;
                    combat.opponent.specs.life = combat.opponentLife;
                    this.server.to(combat.id).emit('combatFinishedNormally', {
                        message: `Combat terminé, le gagnant est ${combat.challenger.name}`,
                        combatWinner: combat.challenger,
                        combatLooser: combat.opponent,
                    });
                    this.server.to(combat.challenger.socketId).emit('combatFinishedNormally', { message: `Vous avez gagné le combat` });
                    this.combatCountdownService.deleteCountdown(gameId);
                    this.gameCountdownService.resumeCountdown(gameId);
                    this.cleanupCombatRoom(combat.id);
                    return;
                }
            } else {
                this.server
                    .to(combat.id)
                    .emit('attackFailure', { playerAttacked: combat.opponent, message: `Attaque échouée de ${combat.challenger.name}` });
            }
        } else {
            const rollResult = this.serverCombatService.rollDice(combat.opponent, combat.challenger);
            this.server.to(combat.id).emit('diceRolled', {
                playerDiceAttack: rollResult.attackingPlayerAttackDice,
                playerDiceDefense: rollResult.attackingPlayerDefenseDice,
                opponentDiceAttack: rollResult.opponentAttackDice,
                opponentDiceDefense: rollResult.opponentDefenseDice,
                attackDice: rollResult.attackDice,
                defenseDice: rollResult.defenseDice,
            });
            if (this.serverCombatService.isAttackSuccess(combat.opponent, combat.challenger, rollResult.attackDice, rollResult.defenseDice)) {
                combat.challenger.specs.life--;
                console.log('combat.challenger.specs.life', combat.challenger.specs.life);
                this.server.to(combat.id).emit('attackSuccess', {
                    attacker: combat.opponent,
                    playerAttacked: combat.challenger,
                    message: `Attaque réussie de ${combat.opponent.name}`,
                });
                if (combat.challenger.specs.life === 0) {
                    this.serverCombatService.combatWinStatsUpdate(combat.opponent, combat.challenger);
                    combat.challenger.specs.life = combat.challengerLife;
                    combat.opponent.specs.life = combat.opponentLife;
                    this.server.to(combat.id).emit('combatFinishedNormally', {
                        message: `Combat terminé, le gagnant est ${combat.opponent.name}`,
                        combatWinner: combat.opponent,
                        combatLooser: combat.challenger,
                    });
                    this.server.to(combat.opponent.socketId).emit('combatFinishedNormally', { message: `Vous avez gagné le combat` });
                    this.gameCountdownService.emit('timeout', gameId);
                    this.combatCountdownService.deleteCountdown(gameId);
                    this.cleanupCombatRoom(combat.id);
                    return;
                }
            } else {
                this.server
                    .to(combat.id)
                    .emit('attackFailure', { playerAttacked: combat.challenger, message: `Attaque échouée de ${combat.opponent.name}` });
            }
        }
        if (combat.challenger.specs.life !== 0 && combat.opponent.specs.life !== 0) this.prepareNextTurn(gameId);
    }
    //TODO: A TESTER
    @SubscribeMessage('attack')
    attack(
        client: Socket,
        data: { gameId: string; attackPlayer: Player; defendPlayer: Player; combatRoomId: string; attackDice: number; defenseDice: number },
    ): void {
        console.log('Attaque de manuelle de :', data.attackPlayer.name);
        const combat = this.serverCombatService.getCombatByGameId(data.gameId);
        let success = this.serverCombatService.isAttackSuccess(data.attackPlayer, data.defendPlayer, data.attackDice, data.defenseDice);
        if (combat.challenger.socketId === data.attackPlayer.socketId) {
            if (success) {
                combat.opponent.specs.life--;
                this.server
                    .to(data.combatRoomId)
                    .emit('attackSuccess', { playerAttacked: combat.opponent, message: `Attaque réussie de ${combat.challenger.name}` });
            } else {
                this.server
                    .to(data.combatRoomId)
                    .emit('attackFailure', { playerAttacked: combat.opponent, message: `Attaque échouée de ${combat.challenger.name}` });
            }
        } else if (combat.opponent.socketId === data.attackPlayer.socketId) {
            if (success) {
                combat.challenger.specs.life--;
                this.server
                    .to(data.combatRoomId)
                    .emit('attackSuccess', { playerAttacked: combat.challenger, message: `Attaque réussie de ${combat.opponent.name}` });
            } else {
                this.server
                    .to(data.combatRoomId)
                    .emit('attackFailure', { playerAttacked: combat.challenger, message: `Attaque échouée de ${combat.opponent.name}` });
            }
        }
        if (combat.challenger.specs.life !== 0 && combat.opponent.specs.life !== 0) {
            this.combatCountdownService.resetTimerSubscription(data.gameId);
            this.prepareNextTurn(data.gameId);
        }
    }

    prepareNextTurn(gameId: string) {
        const combat = this.serverCombatService.getCombatByGameId(gameId);
        if (combat) {
            this.combatCountdownService.resetTimerSubscription(gameId);
            this.startCombatTurns(gameId);
            console.log('On prepare le prochain tour de combat');
        }
    }

    startCombatTurns(gameId: string): void {
        const combat = this.serverCombatService.getCombatByGameId(gameId);
        let currentPlayerTurn: Player;
        if (combat.challenger.socketId === combat.currentTurnSocketId) {
            currentPlayerTurn = combat.challenger;
            combat.currentTurnSocketId = combat.opponent.socketId;
            this.server.to(currentPlayerTurn.socketId).emit('yourTurnCombat');
            this.server.to(combat.opponent.socketId).emit('playerTurnCombat');
        } else {
            currentPlayerTurn = combat.opponent;
            combat.currentTurnSocketId = combat.challenger.socketId;
            this.server.to(currentPlayerTurn.socketId).emit('yourTurnCombat');
            this.server.to(combat.challenger.socketId).emit('playerTurnCombat');
        }
        console.log('Tour de :', currentPlayerTurn.name);
        this.combatCountdownService.startTurnCounter(gameId, currentPlayerTurn.specs.evasions === 0 ? false : true);
    }

    //TODO
    @SubscribeMessage('startEvasion')
    async startEvasion(client: Socket, gameId: string): Promise<void> {
        console.log('une evasion a été commencée');
        console.log('gameId:', gameId);
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
        this.server.to(combat.id).emit('evasionSuccess', {
            success: evasionSuccess,
            message: evasionSuccess ? `${evadingPlayer.name} a réussi à s'échapper du combat` : `Évasion échouée de ${evadingPlayer.name}`,
        });

        if (evasionSuccess) {
            combat.challenger.specs.life = combat.challengerLife;
            combat.opponent.specs.life = combat.opponentLife;
            combat.challenger.specs.nCombats++;
            combat.opponent.specs.nCombats++;
            const game = this.gameCreationService.getGameById(gameId);
            this.serverCombatService.updatePlayersInGame(game);
            this.server.to(gameId).emit('combatFinishedByEvasion', {
                player1: combat.challenger,
                player2: combat.opponent,
                message: "Évasion d'un joueur, combat terminé",
            });
            this.gameCountdownService.resumeCountdown(gameId);
            await this.cleanupCombatRoom(combat.id);
        } else {
            this.prepareNextTurn(combat.id);
        }
    }

    @SubscribeMessage('rollDice')
    rollDice(client: Socket, data: { combatRoomId: string; player: Player; opponent: Player }): void {
        const rollResult = this.serverCombatService.rollDice(data.player, data.opponent);
        this.server.to(data.combatRoomId).emit('diceRolled', {
            playerDiceAttack: rollResult.attackingPlayerAttackDice,
            playerDiceDefense: rollResult.attackingPlayerDefenseDice,
            opponentDiceAttack: rollResult.opponentAttackDice,
            opponentDiceDefense: rollResult.opponentDefenseDice,
            attackDice: rollResult.attackDice,
            defenseDice: rollResult.defenseDice,
        });
    }

    private async cleanupCombatRoom(combatRoomId: string): Promise<void> {
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

//TODO: Maybe delete
// @SubscribeMessage('combatFinishedEvasion')
// async combatFinishedByEvasion(client: Socket, data: { gameId: string; player1: Player; Player2: Player; combatRoomId: string }): Promise<void> {
//     this.server
//         .to(data.gameId)
//         .emit('combatFinishedByEvasion', { player1: data.player1, player2: data.Player2, message: "Évasion d'un joueur, combat terminé" });
//     this.gameCountdownService.resumeCountdown(data.gameId);
//     await this.cleanupCombatRoom(data.combatRoomId);
// }

// @SubscribeMessage('combatFinishedNormal')
// async combatFinishedNormally(
//     client: Socket,
//     data: { gameId: string; combatWinner: Player; combatLooser: Player; combatRoomId: string },
// ): Promise<void> {
//     this.server.to(data.gameId).emit('combatFinishedNormally', {
//         message: `Combat terminé, le gagnant est ${data.combatWinner.name}`,
//         combatWinner: data.combatWinner,
//         combatLooser: data.combatLooser,
//     });
//     this.server.to(data.combatWinner.socketId).emit('combatFinishedNormally', { message: `Vous avez gagné le combat` });
//     if (data.combatWinner === this.serverCombatService.getCombatByGameId(data.gameId).challenger) {
//         this.gameCountdownService.resumeCountdown(data.gameId);
//     } else {
//         this.gameCountdownService.emit('timeout', data.gameId);
//     }
//     await this.cleanupCombatRoom(data.combatRoomId);
// }
