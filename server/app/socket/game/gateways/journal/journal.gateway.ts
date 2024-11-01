import { JournalService } from '@app/socket/game/service/journal/journal.service';
import { JournalEntry } from '@common/journal-entry';
import { Inject } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class JournalGateway {
    @WebSocketServer() server: Server;

    @Inject(JournalService) private journalService: JournalService;

    @SubscribeMessage('getJournalEntries')
    handleGetJournalEntries(client: Socket, data: { gameId: string }): void {
        const entries = this.journalService.getJournalEntries(data.gameId);
        client.emit('journalEntries', entries);
    }

    @SubscribeMessage('logGameEvent')
    handleLogGameEvent(client: Socket, data: { gameId: string; message: string; playersInvolved: string[] }): void {
        const journalEntry: JournalEntry = {
            gameId: data.gameId,
            message: data.message,
            timestamp: new Date(),
            playersInvolved: data.playersInvolved,
        };

        this.journalService.addJournalEntry(data.gameId, journalEntry);

        if (data.playersInvolved.length > 0) {
            data.playersInvolved.forEach((playerId) => {
                this.server.to(playerId).emit('journalEntry', journalEntry);
            });
        } else {
            this.server.to(data.gameId).emit('journalEntry', journalEntry);
        }
    }
}
