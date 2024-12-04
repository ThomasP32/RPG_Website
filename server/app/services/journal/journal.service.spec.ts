import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';
import { JournalService } from './journal.service';

describe('JournalService', () => {
    let service: JournalService;
    let server: Server;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [JournalService],
        }).compile();

        service = module.get<JournalService>(JournalService);
        server = new Server();
        service.initializeServer(server);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should initialize server', () => {
        const newServer = new Server();
        service.initializeServer(newServer);
        expect(service['server']).toBe(newServer);
    });

    it('should log message and emit journalEntry', () => {
        const gameId = 'game123';
        const message = 'Player1 joined the game';
        const playersInvolved = ['Player1'];

        const logMessageSpy = jest.spyOn(service, 'logMessage');
        service.logMessage(gameId, message, playersInvolved);

        expect(logMessageSpy).toHaveBeenCalledWith(gameId, message, playersInvolved);
    });
});
