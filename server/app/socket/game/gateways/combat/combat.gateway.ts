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
    async startCombat(client: Socket, data: { gameId: string; opponent: Player }): Promise<void> {
        const game = this.gameCreationService.getGameById(data.gameId);
        const player = this.gameCreationService.getPlayer(data.gameId, client.id);
        if (game) {
            const combatRoomId = `combat_${data.gameId}_${player.socketId}_${data.opponent.socketId}`;
            await client.join(combatRoomId);
            const sockets = await this.server.in(data.gameId).fetchSockets();
            const opponentSocket = sockets.find((socket) => socket.id === data.opponent.socketId);
            if (opponentSocket) {
                await opponentSocket.join(combatRoomId);
            }
            this.server
                .to(combatRoomId)
                .emit('combatStarted', {
                    message: `${player.name} a commencé un combat contre ${data.opponent.name}`,
                    combatRoomId: combatRoomId,
                    challenger: player,
                });

            let currentTurnPlayerId: string;
            if (player.specs.speed > data.opponent.specs.speed) {
                currentTurnPlayerId = player.socketId;
            } else if (player.specs.speed === data.opponent.specs.speed) {
                currentTurnPlayerId = player.socketId;
            } else {
                currentTurnPlayerId = data.opponent.socketId;
            }
            this.server.to(combatRoomId).emit('updateTurn', { currentPlayerTurn: currentTurnPlayerId, combatRoomId: combatRoomId });
        }
    }
    @SubscribeMessage('attack')
    attack(
        client: Socket,
        data: { attackPlayer: Player; defendPlayer: Player; combatRoomId: string; attackDice: number; defenseDice: number },
    ): void {
        if (this.serverCombatService.isAttackSuccess(data.attackPlayer, data.defendPlayer, data.attackDice, data.defenseDice)) {
            this.server
                .to(data.combatRoomId)
                .emit('attackSuccess', { playerAttacked: data.defendPlayer, message: `Attaque réussie de ${data.attackPlayer.name}` });
        } else {
            this.server.to(data.combatRoomId).emit('attackFailure', { message: `Attaque échouée de ${data.attackPlayer.name}` });
        }
    }

    @SubscribeMessage('startEvasion')
    startEvasion(client: Socket, data: { player: Player; waitingPlayer: Player; gameId: string; combatRoomId: string }): void {
        data.player.specs.nEvasions++;
        const evasionSuccess = Math.random() < 0.4;
        this.server.to(data.combatRoomId).emit('evasionSuccess', {
            success: evasionSuccess,
            waitingPlayer: data.waitingPlayer,
            message: evasionSuccess ? `${data.player.name} a réussi à s'échapper du combat` : 'Évasion échouée',
        });
    }
    @SubscribeMessage('combatFinishedEvasion')
    async combatFinishedByEvasion(client: Socket, data: { gameId: string; player1: Player; Player2: Player; combatRoomId: string }): Promise<void> {
        this.server.to(data.gameId).emit('combatFinishedByEvasion', { message: "Évasion d'un joueur, combat terminé" });
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
        this.server.to(data.combatWinner.socketId).emit('combatFinishedNormally', { message: `Vous avez gagné le combat, continuez votre tour` });
        await this.cleanupCombatRoom(data.combatRoomId);
    }
    @SubscribeMessage('rollDice')
    rollDice(client: Socket, data: { combatRoomId: string; player: Player; opponent: Player }): void {
        const attackingPlayerAttackDice = Math.floor(Math.random() * data.player.specs.attackBonus) + 1;
        const attackingPlayerDefenseDice = Math.floor(Math.random() * data.player.specs.defenseBonus) + 1;
        const opponentAttackDice = Math.floor(Math.random() * data.opponent.specs.attackBonus) + 1;
        const opponentDefenseDice = Math.floor(Math.random() * data.opponent.specs.defenseBonus) + 1;
        this.server.to(data.combatRoomId).emit('diceRolled', {
            playerDiceAttack: attackingPlayerAttackDice,
            playerDiceDefense: attackingPlayerDefenseDice,
            opponentDiceAttack: opponentAttackDice,
            opponentDiceDefense: opponentDefenseDice,
        });
    }
    // @SubscribeMessage('updatePlayersAfterCombat')
    // async updatePlayersAfterCombat(client: Socket, data: { gameId: string; player1: Player; player2: Player }): Promise<void> {
    //     this.server.to(data.gameId).emit('updatedPlayersAfterCombat', { player1: data.player1, player2: data.player2 });
    // }

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
