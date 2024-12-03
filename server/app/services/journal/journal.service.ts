import { JournalEvents } from '@common/events/journal.events';
import { JournalEntry } from '@common/journal-entry';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class JournalService {
    private server: Server;

    initializeServer(server: Server) {
        this.server = server;
    }

    logMessage(roomId: string, message: string, playersInvolved: String[]): void {
        const entry: JournalEntry = { message, timestamp: new Date(), playersInvolved };
        this.server.to(roomId).emit(JournalEvents.JournalEntry, entry);
    }
}
