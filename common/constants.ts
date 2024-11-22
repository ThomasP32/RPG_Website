export enum MapSize {
    SMALL = 'SMALL',
    MEDIUM = 'MEDIUM',
    LARGE = 'LARGE',
}

export enum ProfileType {
    AGGRESSIVE = 'aggressive',
    DEFENSIVE = 'defensive',
}

export const MapConfig = {
    [MapSize.SMALL]: { size: 10, minPlayers: 2, maxPlayers: 2, nbItems: 2 },
    [MapSize.MEDIUM]: { size: 15, minPlayers: 2, maxPlayers: 4, nbItems: 4 },
    [MapSize.LARGE]: { size: 20, minPlayers: 2, maxPlayers: 6, nbItems: 6 },
};

export interface IWaitingRoomParameters {
    MIN_CODE: number;
    MAX_CODE: number;
}

export class WaitingRoomParameters {
    static get MIN_CODE(): number {
        return 1000;
    }
    static get MAX_CODE(): number {
        return 9999;
    }
}

export const TIME_LIMIT_DELAY: number = 3000;

export const TIME_REDIRECTION: number = 5000;

export const TIME_PULSE: number = 500;

export const TIME_FOR_POSITION_UPDATE: number = 150;

export const HALF = 0.5;

export const DEFAULT_HP = 4;

export const DEFAULT_SPEED = 4;

export const DEFAULT_ATTACK = 4;

export const DEFAULT_DEFENSE = 4;

export const DEFAULT_EVASIONS = 2;

export const DEFAULT_ACTIONS = 1;

export const BONUS = 2;

export const TURN_DURATION = 30;

export const PERCENTAGE: number = 100;

export const MINUTE: number = 60;

export const MAX_CHAR: number = 2;

export const COUNTDOWN_DURATION: number = 5;

export const COUNTDOWN_NOEVASION_DURATION: number = 3;

export const COUNTDOWN_COMBAT_DURATION: number = 5;
