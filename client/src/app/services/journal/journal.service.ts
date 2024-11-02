import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { JournalEntry } from '@common/journal-entry';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class JournalService {
    private journalEntriesSubject = new BehaviorSubject<JournalEntry[]>([]);
    public journalEntries$ = this.journalEntriesSubject.asObservable();

    constructor(private socketService: SocketService) {
        this.listenToJournalEvents();
    }

    listenToJournalEvents() {
        this.socketService.listen<{ message: string; timestamp: Date; playersInvolved: String[] }>('journalEntry').subscribe((journalEntry) => {
            const currentEntries = this.journalEntriesSubject.value;
            this.journalEntriesSubject.next([...currentEntries, { ...journalEntry }]);
        });
    }
}
