import { Player } from '@common/game';
import { Coordinate, Item } from '@common/map.types';

export interface Door {
    isOpen: boolean;
}

export interface Cell {
    Coordinate: Coordinate;
    Door: Door;
    isOccupied: boolean;
    Player: Player;
    Item: Item;
    Tile: Tile;
}
