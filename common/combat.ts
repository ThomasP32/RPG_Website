import { Player } from './game';

export interface Combat {
    id: string;
    challenger: Player;
    opponent: Player;
    currentTurnSocketId: string;
    challengerLife: number;
    opponentLife: number;
    challengerAttack: number;
    opponentAttack: number;
    challengerDefense: number;
    opponentDefense: number;
}

export interface RollResult {
    attackDice: number;
    defenseDice: number;
}
