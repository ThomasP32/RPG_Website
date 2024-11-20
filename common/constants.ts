import { ItemCategory } from './map.types';

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

export const ALL_ITEMS: ItemCategory[] = [
    ItemCategory.Armor,
    ItemCategory.Bomb,
    ItemCategory.Sword,
    ItemCategory.IceSkates,
    ItemCategory.GrapplingHook,
    ItemCategory.TimeTwister,
];
