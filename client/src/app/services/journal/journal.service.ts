import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Player } from '@common/game';
import { JournalEntry } from '@common/journal-entry';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class JournalService {
    private journalEntriesSubject = new BehaviorSubject<JournalEntry[]>([]);
    public journalEntries$: Observable<JournalEntry[]> = this.journalEntriesSubject.asObservable();

    constructor(private socketService: SocketService) {
        this.listenToJournalEvents();
    }

    listenToJournalEvents() {
        this.socketService.listen<{ message: string; timestamp: Date; playersInvolved?: Player[] }>('journalEntry').subscribe((journalEntry) => {
            const currentEntries = this.journalEntriesSubject.value;
            this.journalEntriesSubject.next([...currentEntries, { ...journalEntry }]);
        });
    }
}
