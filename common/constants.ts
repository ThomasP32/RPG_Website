export const TURN_DURATION: number = 30;
export enum MapSize {
    SMALL = 'SMALL',
    MEDIUM = 'MEDIUM',
    LARGE = 'LARGE',
}

export const MapConfig = {
    [MapSize.SMALL]: { size: 10, minPlayers: 2, maxPlayers: 2, nbItems: 2 },
    [MapSize.MEDIUM]: { size: 15, minPlayers: 2, maxPlayers: 4, nbItems: 4 },
    [MapSize.LARGE]: { size: 20, minPlayers: 2, maxPlayers: 6, nbItems: 6 },
};

export interface IWaitingRoomParameters {
    MIN_CODE: number;
    MAX_CODE: number;
    TIME_LIMIT: number;
}

export class WaitingRoomParameters {
    static get MIN_CODE(): number {
        return 1000;
    }
    static get MAX_CODE(): number {
        return 9999;
    }
    static get TIME_LIMIT(): number {
        return 3000;
    }
}


export const HALF = 0.5;
