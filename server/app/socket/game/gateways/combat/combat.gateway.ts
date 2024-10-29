import { Player } from '@common/game';
import { Inject } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ServerCombatService } from '../../service/combat/combat.service';
import { GameCreationService } from '../../service/game-creation/game-creation.service';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class CombatGateway {
    @WebSocketServer()
    server: Server;

    @Inject(GameCreationService) private gameCreationService: GameCreationService;
    @Inject(ServerCombatService) private serverCombatService: ServerCombatService;

    @SubscribeMessage('startCombat')
    startCombat(client: Socket, data: { gameId: string; opponent: Player }): void {
        const game = this.gameCreationService.getGameById(data.gameId);
        const player = this.gameCreationService.getPlayer(data.gameId, client.id);
        if (game) {
            const combatRoomId = `combat_${data.gameId}_${player.socketId}_${data.opponent.socketId}`;
            client.join(combatRoomId);
            const opponentSocket = this.server.sockets.sockets.get(data.opponent.socketId);
            if (opponentSocket) {
                opponentSocket.join(combatRoomId);
            }
            this.server
                .to(data.gameId)
                .emit('combatStarted', { message: `${player.name} a commencé un combat contre ${data.opponent.name}`, combatRoomId: combatRoomId });
            this.server.to(data.opponent.socketId).emit('challengeReceived', { combatRoomId: combatRoomId });

            let currentTurnPlayerId: string;
            if (player.specs.speed > data.opponent.specs.speed) {
                currentTurnPlayerId = player.socketId;
            } else if (player.specs.speed === data.opponent.specs.speed) {
                currentTurnPlayerId = data.opponent.socketId;
            } else {
                currentTurnPlayerId = data.opponent.socketId;
            }
            this.server.to(combatRoomId).emit('updateTurn', { currentPlayerTurn: currentTurnPlayerId, combatRoomId: combatRoomId });
        }
    }
    @SubscribeMessage('attack')
    attack(
        client: Socket,
        data: { attackPlayer: Player; defendPlayer: Player; gameId: string; player1Dice: number; player2Dice: number; combatRoomId: string },
    ): void {
        if (this.serverCombatService.isAttackSuccess(data.attackPlayer, data.defendPlayer, data.player1Dice, data.player2Dice)) {
            this.server
                .to(data.combatRoomId)
                .emit('attackSuccess', { playerAttacked: data.defendPlayer, message: `Attaque réussie de ${data.attackPlayer.name}` });
        } else {
            this.server.to(data.combatRoomId).emit('attackFailure', { message: `Attaque échouée de ${data.attackPlayer.name}` });
        }
    }

    @SubscribeMessage('startEvasion')
    startEvasion(client: Socket, data: { player: Player; gameId: string; combatRoomId: string }): void {
        data.player.specs.nEvasions++;
        const evasionSuccess = Math.random() < 0.4;
        this.server.to(data.combatRoomId).emit('evasionSuccess', {
            success: evasionSuccess,
            message: evasionSuccess ? `${data.player.name} a réussi à s'échapper du combat` : 'Évasion échouée',
        });
    }
    @SubscribeMessage('combatFinishedEvasion')
    async combatFinishedByEvasion(
        client: Socket,
        data: { gameId: string; evasion: boolean; player1: Player; Player2: Player; combatRoomId: string },
    ): Promise<void> {
        this.server.to(data.gameId).emit('combatFinishedByEvasion', { message: "Évasion d'un joueur, combat terminé" });
        await this.cleanupCombatRoom(data.combatRoomId);
    }
    @SubscribeMessage('combatFinishedNormal')
    async combatFinishedNormally(client: Socket, data: { gameId: string; combatWinner: Player; combatRoomId: string }): Promise<void> {
        this.server.to(data.gameId).emit('combatFinishedNormally', { message: `Combat terminé, le gagnant est ${data.combatWinner.name}` });
        this.server.to(data.combatWinner.socketId).emit('combatFinishedNormally', { message: `Vous avez gagné le combat, continuez votre tour` });
        await this.cleanupCombatRoom(data.combatRoomId);
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
