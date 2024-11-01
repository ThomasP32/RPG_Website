import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JournalService } from '@app/services/journal/journal.service';
import { Player } from '@common/game';
import { JournalEntry } from '@common/journal-entry';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-journal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './journal.component.html',
    styleUrl: './journal.component.scss',
})
export class JournalComponent implements OnInit {
    @Input() player: Player;
    journalEntries: JournalEntry[] = [];
    filteredJournalEntries: JournalEntry[] = [];
    private subscription: Subscription;
    filter: 'all' | 'involved-only' = 'all';

    constructor(public journalService: JournalService) {}

    ngOnInit(): void {
        this.subscription = this.journalService.journalEntries$.subscribe((entries) => {
            this.journalEntries = entries;
            this.applyFilter();
        });
    }

    toggleShowAll(): void {
        this.applyFilter();
    }

    private applyFilter(): void {
        if (this.filter === 'involved-only') {
            this.filteredJournalEntries = this.journalEntries.filter((entry) => entry.playersInvolved && entry.playersInvolved.includes(this.player));
        } else {
            this.filteredJournalEntries = this.journalEntries;
        }
        console.log(`Filtered entries for player ${this.player}:`, this.filteredJournalEntries);
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
}
