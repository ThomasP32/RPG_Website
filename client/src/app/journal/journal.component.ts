import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { JournalService } from '../services/journal/journal.service';

@Component({
    selector: 'app-journal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './journal.component.html',
    styleUrl: './journal.component.scss',
})
export class JournalComponent {
    constructor(private journalService: JournalService) {}

    journalEntries$: JournalService['journalEntries$'];

    async ngOnInit(): Promise<void> {
        this.journalEntries$ = await this.journalService.journalEntries$;
    }
}
