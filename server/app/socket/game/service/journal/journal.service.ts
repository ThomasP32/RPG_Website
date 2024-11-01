import { JournalEntry } from '@common/journal-entry';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JournalService {
    private gameJournals: Record<string, JournalEntry[]> = {};

    addJournalEntry(gameId: string, journalEntry: JournalEntry): void {
        if (!this.gameJournals[gameId]) {
            this.gameJournals[gameId] = [];
        }
        this.gameJournals[gameId].push(journalEntry);
    }

    getJournalEntries(gameId: string): JournalEntry[] {
        return this.gameJournals[gameId] || [];
    }
}
