import { ItemCategory } from './map.types';

export enum MapSize {
    SMALL = 'SMALL',
    MEDIUM = 'MEDIUM',
    LARGE = 'LARGE',
}

export enum ProfileType {
    AGGRESSIVE = 'aggressive',
    DEFENSIVE = 'defensive',
    NORMAL = '',
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

export enum tableColumns {
    COMBAT_COLUMN = 4,
    EVASION_COLUMN = 5,
    VICTORIES_COLUMN = 6,
    DEFEATS_COLUMN = 7,
    LOST_LIFE_COLUMN = 8,
    STOLEN_LIFE_COLUMN = 9,
    OBJECT_COLUMN = 10,
    TILES_COLUMN = 11,
}

export const TIME_LIMIT_DELAY: number = 3000;

export const TIME_REDIRECTION: number = 5000;

export const VIRTUAL_PLAYER_DELAY: number = 6000;

export const VIRTUAL_DELAY_CONSTANT: number = 5000;

export const COUNTDOWN_INTERVAL: number = 1000;

export const TIME_PULSE: number = 500;

export const TIME_FOR_POSITION_UPDATE: number = 150;

export const HALF = 0.5;

export const ALL_ITEMS: ItemCategory[] = [
    ItemCategory.Armor,
    ItemCategory.Flask,
    ItemCategory.Sword,
    ItemCategory.IceSkates,
    ItemCategory.WallBreaker,
    ItemCategory.Amulet,
];

export const DEFAULT_HP: number = 4;

export const DEFAULT_SPEED: number = 4;

export const DEFAULT_ATTACK: number = 4;

export const DEFAULT_DEFENSE: number = 4;

export const MAXIMUM_BONUS: number = 6;

export const MINIMUM_BONUS: number = 4;

export const DEFAULT_EVASIONS: number = 2;

export const DEFAULT_ACTIONS: number = 1;

export const BONUS: number = 2;

export const TURN_DURATION = 30;

export const DELAY: number = 3;

export const PERCENTAGE: number = 100;

export const MINUTE: number = 60;

export const MAX_CHAR: number = 2;

export const COUNTDOWN_NOEVASION_DURATION: number = 3;

export const COUNTDOWN_COMBAT_DURATION: number = 5;

export const SWORD_ATTACK_BONUS: number = 4;

export const SWORD_SPEED_BONUS: number = 2;

export const ARMOR_DEFENSE_BONUS: number = 5;

export const ARMOR_SPEED_PENALTY: number = 1;

export const ICE_ATTACK_PENALTY: number = 2;

export const ICE_DEFENSE_PENALTY: number = 2;

export const EVASION_SUCCESS_RATE: number = 0.4;

export const INVENTORY_SIZE: number = 2;

export const DEFENDING_PLAYER_LIFE: number = 2;

export const ROLL_DICE_CONSTANT: number = 1;

export const SUFFIX_INCREMENT: number = 1;

export const SUFFIX_VALUE: number = 10;

export const BONUS_REDUCTION: number = 2;

export const MINIMUM_MOVES: number = 1;
