import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class JournalService {
    private server: Server;

    initializeServer(server: Server) {
        this.server = server;
    }

    logMessage(gameId: string, message: string, playersInvolved: String[]): void {
        const entry = { message, timestamp: new Date(), playersInvolved };
        this.server.to(gameId).emit('journalEntry', entry);
    }
}
