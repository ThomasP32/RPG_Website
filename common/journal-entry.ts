export interface JournalEntry {
    gameId: string;
    message: string;
    timestamp: Date;
    playersInvolved: string[];
}
