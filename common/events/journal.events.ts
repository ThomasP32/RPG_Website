export enum JournalEvents {
    JournalEntry = 'journalEntry',
}

export interface Entry {
    message: string;
    timestamp: Date;
    playersInvolved: string[];
}
