import { Coordinate, ItemCategory, Map } from './map.types';

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

export enum Bonus {
    D4 = 4,
    D6 = 6,
}

export interface PlayerPosition {
    player: Player;
    coordinate: Coordinate;
}

export interface Specs {
    life: number;
    speed: number;
    attack: number;
    defense: number;
    attackBonus: Bonus;
    defenseBonus: Bonus;
    movePoints: number;
    actions: number;
}

export interface Player {
    socketId: string;
    name: string;
    avatar: Avatar;
    isActive: boolean;
    specs: Specs;
    inventory: ItemCategory[];
    position: Coordinate;
    turn: number;
    nVictories: number;
    nDefeats: number;
    nCombats: number;
    nEvasions: number;
    nLifeTaken: number;
    nLifeLost: number;
}

export interface GameRoom extends Map {
    id: string;
    hostSocketId: string;
    players: Player[];
    availableAvatars: Avatar[];
    currentTurn: number;
    nDoorsManipulated: number;
    visitedTiles: Coordinate[];
    duration: number;
    nTurns: number;
    debug: boolean;
}

export interface GameRoomCtf extends GameRoom {
    nPlayersCtf: number;
}
