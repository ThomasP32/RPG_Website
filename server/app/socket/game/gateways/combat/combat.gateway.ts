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
    startCombat(client: Socket, data: { gameId: string; opponentName: string }): void {
        const opponent = this.gameCreationService.getPlayer(data.gameId, data.opponentName);
        const player = this.gameCreationService.getPlayer(data.gameId, client.id);
        const game = this.gameCreationService.getGame(data.gameId);
        if (game) {
            this.server.to(data.gameId).emit('combatStarted', { message: `${player.name} a commencé un combat contre ${opponent.name}` });
            let currentTurnPlayerId: string;
            if (player.specs.speed > opponent.specs.speed) {
                currentTurnPlayerId = player.socketId;
            } else if (player.specs.speed === opponent.specs.speed) {
                currentTurnPlayerId = opponent.socketId;
            } else {
                currentTurnPlayerId = opponent.socketId;
            }
            client.emit('updateTurn', { currentPlayerTurn: currentTurnPlayerId });
        }
    }
    @SubscribeMessage('attack')
    attack(client: Socket, data: { attackPlayer: Player; defendPlayer: Player; gameId: string; player1Dice: number; player2Dice: number }) {
        if (this.serverCombatService.isAttackSuccess(data.attackPlayer, data.defendPlayer, data.player1Dice, data.player2Dice)) {
            client.emit('attackSuccess', { playerAttacked: data.defendPlayer, message: `Attaque réussie de ${data.attackPlayer.name}` });
        } else {
            client.emit('attackFailure', { message: `Attaque échouée de ${data.attackPlayer.name}` });
        }
    }

    @SubscribeMessage('startEvasion')
    startEvasion(client: Socket, data: { player: Player; gameId: string }): void {
        data.player.specs.nEvasions++;
        const evasionSuccess = Math.random() < 0.4;
        if (evasionSuccess) {
            client.emit('evasionSuccess', { success: true, message: `${data.player.name} a réussi à s'échapper du combat` });
        } else {
            client.emit('evasionSuccess', { success: false, message: 'Évasion échouée' });
        }
    }
    @SubscribeMessage('combatFinishedEvasion')
    combatFinishedByEvasion(client: Socket, data: { gameId: string; evasion: boolean; player1: Player; Player2: Player }): void {
        if (data.evasion) {
            this.server.to(data.gameId).emit('combatFinishedByEvasion', { message: "Évasion d'un joueur, combat terminé" });
        } else {
            this.server.to(data.gameId).emit('combatFinishedByEvasion', { message: 'Combat terminé' });
        }
    }
    @SubscribeMessage('combatFinishedNormal')
    combatFinishedNormally(client: Socket, data: { gameId: string; combatWinner: Player }): void {
        this.server.to(data.gameId).emit('combatFinishedNormally', { message: `Combat terminé, le gagnant est ${data.combatWinner.name}` });
        this.server.to(data.combatWinner.socketId).emit('combatFinishedNormally', { message: `Vous avez gagné le combat, continuez votre tour` });
    }
}
