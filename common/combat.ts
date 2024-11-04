import { Player } from './game';

export interface Combat {
    id: string;
    challenger: Player;
    opponent: Player;
    currentTurnSocketId: string;
}
