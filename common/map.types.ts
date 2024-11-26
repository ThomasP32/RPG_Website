export interface Coordinate {
    x: number;
    y: number;
}

export enum TileCategory {
    Water = 'water',
    Ice = 'ice',
    Wall = 'wall',
    Floor = 'floor',
    Door = 'door',
}

export enum Mode {
    Ctf = 'ctf',
    Classic = 'classique',
}

export enum ItemCategory {
    Armor = 'armor',
    Sword = 'sword',
    Flask = 'flask',
    WallBreaker = 'wallbreaker',
    IceSkates = 'iceskates',
    TimeTwister = 'timetwister',
    Random = 'randomitem',
    Flag = 'flag',
    StartingPoint = 'startingPoint',
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
}

export interface Map {
    name: string;
    description: string;
    imagePreview: string;
    mode: Mode;
    mapSize: Coordinate;
    startTiles: StartTile[];
    items: Item[];
    doorTiles: DoorTile[];
    tiles: Tile[];
}

export interface DetailedMap extends Map {
    _id: Object;
    isVisible: boolean;
    lastModified: Date;
}
