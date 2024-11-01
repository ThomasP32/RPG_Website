import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { JournalEntry } from '@common/journal-entry';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-journal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './journal.component.html',
    styleUrl: './journal.component.scss',
})
export class JournalComponent implements OnInit {
    @Input() player: { name: string } = { name: '' };
    @Input() gameId: string;
    journalEntries: JournalEntry[] = [];
    filter: 'all' | 'involved-only' = 'all';
    entrySubscription: Subscription;

    constructor(private socketService: SocketService) {}

    ngOnInit(): void {
        this.entrySubscription = this.socketService.listen<JournalEntry>('journalEntry').subscribe((journalEntry) => {
            if (this.filter === 'all' || journalEntry.playersInvolved.includes(this.player.name)) {
                this.journalEntries.push(journalEntry);
            }
        });

        this.socketService.sendMessage('getJournalEntries', { gameId: this.gameId });
        this.socketService.listen<JournalEntry[]>('journalEntries').subscribe((entries) => {
            this.journalEntries = entries;
        });
    }

    toggleShowAll(): void {
        this.filter = this.filter === 'all' ? 'involved-only' : 'all';
        this.applyFilter();
    }

    private applyFilter(): void {
        this.socketService.sendMessage('getJournalEntries', { gameId: 'game-id' });
    }

    ngOnDestroy(): void {
        if (this.entrySubscription) {
            this.entrySubscription.unsubscribe();
        }
    }
}
