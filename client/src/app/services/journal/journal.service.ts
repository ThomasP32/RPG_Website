import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { JournalEvents } from '@common/events/journal.events';
import { JournalEntry } from '@common/journal-entry';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class JournalService {
    private readonly journalEntriesSubject = new BehaviorSubject<JournalEntry[]>([]);
    public journalEntries$ = this.journalEntriesSubject.asObservable();

    constructor(private readonly socketService: SocketService) {
        this.socketService = socketService;
        this.listenToJournalEvents();
    }

    listenToJournalEvents() {
        this.socketService.listen<JournalEntry>(JournalEvents.JournalEntry).subscribe((journalEntry) => {
            const currentEntries = this.journalEntriesSubject.value;
            this.journalEntriesSubject.next([...currentEntries, { ...journalEntry }]);
        });
    }
}
