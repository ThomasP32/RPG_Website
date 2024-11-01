import { Player } from '@common/game';
import { Inject } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ServerCombatService } from '../../service/combat/combat.service';
import { GameCreationService } from '../../service/game-creation/game-creation.service';
import { JournalService } from '../../service/journal/journal.service';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class CombatGateway {
    @WebSocketServer()
    server: Server;

    @Inject(GameCreationService) private gameCreationService: GameCreationService;
    @Inject(ServerCombatService) private serverCombatService: ServerCombatService;
    @Inject(JournalService) private journalService: JournalService;

    @SubscribeMessage('startCombat')
    startCombat(client: Socket, data: { gameId: string; startCombatPlayer: Player; player2: Player }): void {
        const game = this.gameCreationService.getGameById(data.gameId);
        if (game) {
            this.server
                .to(data.gameId)
                .emit('combatStarted', { message: `${data.startCombatPlayer.name} a commencé un combat contre ${data.player2.name}` });
            this.journalService.logMessage(data.gameId, `${data.startCombatPlayer.name} a commencé un combat contre ${data.player2.name}`);
            let currentTurnPlayerId: string;
            if (data.startCombatPlayer.specs.speed > data.player2.specs.speed) {
                currentTurnPlayerId = data.startCombatPlayer.socketId;
            } else if (data.startCombatPlayer.specs.speed === data.player2.specs.speed) {
                currentTurnPlayerId = data.player2.socketId;
            } else {
                currentTurnPlayerId = data.player2.socketId;
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
            client.broadcast.to(data.gameId).emit('combatFinishedByEvasion', { message: "Évasion d'un joueur, combat terminé" });
        } else {
            client.broadcast.to(data.gameId).emit('combatFinishedByEvasion', { message: 'Combat terminé' });
        }
        this.journalService.logMessage(data.gameId, `Le combat est terminé.`);
    }
    @SubscribeMessage('combatFinishedNormal')
    combatFinishedNormally(client: Socket, data: { gameId: string; combatWinner: Player }): void {
        client.broadcast.to(data.gameId).emit('combatFinishedNormally', { message: `Combat terminé, le gagnant est ${data.combatWinner.name}` });
        this.journalService.logMessage(data.gameId, `Combat terminé, le gagnant est ${data.combatWinner.name}`);
    }
}
