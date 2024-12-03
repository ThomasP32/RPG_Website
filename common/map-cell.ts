import { Player } from './game';
import { Coordinate, ItemCategory, TileCategory } from './map.types';

export interface Door {
    isOpen: boolean;
    isDoor: boolean;
}

export interface Cell {
    coordinate: Coordinate;
    door: Door;
    player?: Player;
    item?: ItemCategory;
    isStartingPoint: boolean;
    tileType: TileCategory;
    isOccupied: boolean;
    isHovered: boolean;
    alternateCoordinates: Coordinate;
}
