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
            this.attackOnTimeout(gameId);
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
        const combat = this.serverCombatService.getCombatByGameId(gameId)
        if(combat.currentTurnSocketId === combat.challenger) {
            //this.rollDice();
            this.serverCombatService.isAttackSuccess(combat.challenger, combat.opponent, )
        }

    }

    prepareNextTurn(gameId: string) {
        this.combatCountdownService.resetTimerSubscription(gameId);
        this.startCombatTurns(gameId);
        console.log('On prepare le prochain tour de combat');
    }

    startCombatTurns(gameId: string): void {
        const combat = this.serverCombatService.getCombatByGameId(gameId);
        let currentPlayerTurn: Player;
        if (combat.challenger.socketId === combat.currentTurnSocketId) {
            currentPlayerTurn = combat.challenger;
            this.server.to(combat.currentTurnSocketId).emit('yourTurnCombat');
            this.server.to(combat.opponent.socketId).emit('playerTurnCombat');
        } else {
            currentPlayerTurn = combat.opponent;
            this.server.to(combat.currentTurnSocketId).emit('yourTurnCombat');
            this.server.to(combat.challenger.socketId).emit('playerTurnCombat');
        }
        this.combatCountdownService.startTurnCounter(gameId, currentPlayerTurn.specs.nEvasions !== 0 ? true : false);
    }

    @SubscribeMessage('attack')
    attack(
        client: Socket,
        data: { gameId: string; attackPlayer: Player; defendPlayer: Player; combatRoomId: string; attackDice: number; defenseDice: number },
    ): void {
        if (this.serverCombatService.isAttackSuccess(data.attackPlayer, data.defendPlayer, data.attackDice, data.defenseDice)) {
            this.server
                .to(data.combatRoomId)
                .emit('attackSuccess', { playerAttacked: data.defendPlayer, message: `Attaque réussie de ${data.attackPlayer.name}` });
        } else {
            this.server
                .to(data.combatRoomId)
                .emit('attackFailure', { playerAttacked: data.defendPlayer, message: `Attaque échouée de ${data.attackPlayer.name}` });
        }
        this.prepareNextTurn(data.gameId);
    }

    @SubscribeMessage('startEvasion')
    startEvasion(client: Socket, data: { player: Player; waitingPlayer: Player; gameId: string; combatRoomId: string }): void {
        data.player.specs.nEvasions++;
        const evasionSuccess = Math.random() < 0.4;
        this.server.to(data.combatRoomId).emit('evasionSuccess', {
            success: evasionSuccess,
            waitingPlayer: data.waitingPlayer,
            message: evasionSuccess ? `${data.player.name} a réussi à s'échapper du combat` : `Évasion échouée de ${data.player.name}`,
        });
        if (!evasionSuccess) {
            this.prepareNextTurn(data.gameId);
        }
    }

    @SubscribeMessage('combatFinishedEvasion')
    async combatFinishedByEvasion(client: Socket, data: { gameId: string; player1: Player; Player2: Player; combatRoomId: string }): Promise<void> {
        this.server
            .to(data.gameId)
            .emit('combatFinishedByEvasion', { player1: data.player1, player2: data.Player2, message: "Évasion d'un joueur, combat terminé" });
        this.gameCountdownService.resumeCountdown(data.gameId);
        await this.cleanupCombatRoom(data.combatRoomId);
    }

    @SubscribeMessage('combatFinishedNormal')
    async combatFinishedNormally(
        client: Socket,
        data: { gameId: string; combatWinner: Player; combatLooser: Player; combatRoomId: string },
    ): Promise<void> {
        this.server.to(data.gameId).emit('combatFinishedNormally', {
            message: `Combat terminé, le gagnant est ${data.combatWinner.name}`,
            combatWinner: data.combatWinner,
            combatLooser: data.combatLooser,
        });
        this.server.to(data.combatWinner.socketId).emit('combatFinishedNormally', { message: `Vous avez gagné le combat` });
        if (data.combatWinner === this.serverCombatService.getCombatByGameId(data.gameId).challenger) {
            this.gameCountdownService.resumeCountdown(data.gameId);
        } else {
            this.gameCountdownService.emit('timeout', data.gameId);
        }
        await this.cleanupCombatRoom(data.combatRoomId);
    }

    @SubscribeMessage('rollDice')
    rollDice(client: Socket, data: { combatRoomId: string; player: Player; opponent: Player }): void {
        const attackingPlayerAttackDice = Math.floor(Math.random() * data.player.specs.attackBonus) + 1;
        const attackingPlayerDefenseDice = Math.floor(Math.random() * data.player.specs.defenseBonus) + 1;
        const opponentAttackDice = Math.floor(Math.random() * data.opponent.specs.attackBonus) + 1;
        const opponentDefenseDice = Math.floor(Math.random() * data.opponent.specs.defenseBonus) + 1;
        const attackDice = data.player.specs.attack + attackingPlayerAttackDice;
        const defenseDice = data.opponent.specs.defense + opponentDefenseDice;
        this.server.to(data.combatRoomId).emit('diceRolled', {
            playerDiceAttack: attackingPlayerAttackDice,
            playerDiceDefense: attackingPlayerDefenseDice,
            opponentDiceAttack: opponentAttackDice,
            opponentDiceDefense: opponentDefenseDice,
            attackDice: attackDice,
            defenseDice: defenseDice,
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
