export interface Coordinate {
    x: number;
    y: number;
}

export enum TileCategory {
    Water = 'water',
    Ice = 'ice',
    Wall = 'wall',
}

export enum Mode {
    Ctf = 'ctf',
    Classic = 'classic',
}

export enum ItemCategory {
    Hat = 'hat',
    Jar = 'jar',
    Key = 'key',
    Mask = 'mask',
    Random = 'random',
    Vest = 'vest',
    Acidgun = 'acidgun',
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
    _id?: Object;
    name: string;
    description: string;
    imagePreview: string;
    mode: Mode;
    isVisible?: boolean;
    mapSize: Coordinate;
    startTiles: StartTile[];
    items: Item[];
    doorTiles: DoorTile[];
    tiles: Tile[];
    lastModified?: Date;
}
