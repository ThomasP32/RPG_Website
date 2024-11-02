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

export const WaitingRoomParameters: IWaitingRoomParameters = {
    MIN_CODE: 1000,
    MAX_CODE: 9999,
    TIME_LIMIT: 3000,
};
export const TURN_DURATION: number = 30;
