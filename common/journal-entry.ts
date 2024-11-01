import { Player } from '@common/game';

export interface JournalEntry {
    message: string;
    timestamp: Date;
    playersInvolved?: Player[];
}
