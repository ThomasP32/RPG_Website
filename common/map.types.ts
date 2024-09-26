export interface Coordinate {
    x: number;
    y: number;
}

export enum TileCategory {
    Water = 'water',
    Ice = 'ice',
    Wall = 'wall',
}

export enum ItemCategory {
    Sword = 'sword',
}

export interface Tile {
    coordinate: Coordinate;
    category: TileCategory;
}

export interface DoorTile {
    coordinate: Coordinate;
    isOpened: boolean;
}

export interface StartTile {
    coordinate: Coordinate;
}

export interface Item {
    coordinate: Coordinate;
    category: ItemCategory;

    // les fonctionnalités supplémentaires des items seront ajoutée ici
}

export interface Map {
    _id?: string;
    name: string;
    isVisible: boolean;
    mapSize: Coordinate;
    startTiles: StartTile[];
    items: Item[];
    doorTiles: DoorTile[];
    tiles: Tile[];
}
