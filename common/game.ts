import { Coordinate, ItemCategory, Map } from '@common/map.types';

export enum Avatar {
    Avatar1 = 1,
    Avatar2 = 2,
    Avatar3 = 3,
    Avatar4 = 4,
    Avatar5 = 5,
    Avatar6 = 6,
    Avatar7 = 7,
    Avatar8 = 8,
    Avatar9 = 9,
    Avatar10 = 10,
    Avatar11 = 11,
    Avatar12 = 12,
}

export enum BotName {
    Bot1 = 'AlphaBot',
    Bot2 = 'RoboWarrior',
    Bot3 = 'CyberHawk',
    Bot4 = 'SteelFist',
    Bot5 = 'MechaMage',
    Bot6 = 'IronClad',
    Bot7 = 'TechNinja',
    Bot8 = 'ShadowBot',
    Bot9 = 'RoboKnight',
    Bot10 = 'CyberAssassin',
}

export enum Bonus {
    D4 = 4,
    D6 = 6,
}

export interface Specs {
    life: number;
    evasions: number;
    speed: number;
    attack: number;
    defense: number;
    attackBonus: Bonus;
    defenseBonus: Bonus;
    movePoints: number;
    actions: number;
    nVictories: number;
    nDefeats: number;
    nCombats: number;
    nEvasions: number;
    nLifeTaken: number;
    nLifeLost: number;
}

export interface Player {
    socketId: string;
    name: string;
    avatar: Avatar;
    isActive: boolean;
    specs: Specs;
    inventory: ItemCategory[];
    position: Coordinate;
    initialPosition: Coordinate;
    turn: number;
    visitedTiles: Coordinate[];
    isVirtual: boolean;
}

export interface Game extends Map {
    id: string;
    hostSocketId: string;
    players: Player[];
    currentTurn: number;
    nDoorsManipulated: number;
    duration: number;
    nTurns: number;
    debug: boolean;
    isLocked: boolean;
    hasStarted: boolean;
}

export interface GameCtf extends Game {
    nPlayersCtf: number;
}
