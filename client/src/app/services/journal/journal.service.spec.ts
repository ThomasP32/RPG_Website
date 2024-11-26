import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { JournalEntry } from '@common/journal-entry';
import { of } from 'rxjs';
import { JournalService } from './journal.service';

describe('JournalService', () => {
    let service: JournalService;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('SocketService', {
            listen: of(),
        });

        TestBed.configureTestingModule({
            providers: [JournalService, { provide: SocketService, useValue: spy }],
        });

        service = TestBed.inject(JournalService);
    });

    it('should append new journal entries to the existing ones', fakeAsync(() => {
        const initialEntry: JournalEntry = {
            message: 'Initial message',
            timestamp: new Date(),
            playersInvolved: ['Player1'],
        };

        const newEntry: JournalEntry = {
            message: 'New message',
            timestamp: new Date(),
            playersInvolved: ['Player2'],
        };

        service['journalEntriesSubject'].next([initialEntry]);

        const socketService = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
        socketService.listen.and.returnValue(of(newEntry));

        service.listenToJournalEvents();

        const expected: JournalEntry[] = [initialEntry, newEntry];
        tick(5000);
        const entries = service['journalEntriesSubject'].getValue();
        expect(entries).toEqual(expected);
    }));

    it('should handle multiple journal entries correctly', fakeAsync(() => {
        const initialEntries: JournalEntry[] = [
            {
                message: 'Initial message 1',
                timestamp: new Date(),
                playersInvolved: ['Player1'],
            },
            {
                message: 'Initial message 2',
                timestamp: new Date(),
                playersInvolved: ['Player2'],
            },
        ];

        const newEntry: JournalEntry = {
            message: 'New message',
            timestamp: new Date(),
            playersInvolved: ['Player3'],
        };

        service['journalEntriesSubject'].next(initialEntries);

        const socketService = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
        socketService.listen.and.returnValue(of(newEntry));

        service.listenToJournalEvents();

        const expected: JournalEntry[] = [...initialEntries, newEntry];
        tick(5000);
        const entries = service['journalEntriesSubject'].getValue();
        expect(entries).toEqual(expected);
    }));

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should listen to journal events and update journalEntries', fakeAsync(() => {
        const mockJournalEntry: JournalEntry = {
            message: 'Test message',
            timestamp: new Date(),
            playersInvolved: ['Player1'],
        };

        const socketService = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
        socketService.listen.and.returnValue(of(mockJournalEntry));

        service.listenToJournalEvents();

        const expected: JournalEntry[] = [mockJournalEntry];
        tick(5000);
        const entries = service['journalEntriesSubject'].getValue();
        expect(entries).toEqual(expected);
    }));
});
