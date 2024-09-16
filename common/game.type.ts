export interface Coordinate {
    x: number;
    y: number;
}

export interface DoorTile {
    coordinate: Coordinate;
    isOpened: boolean;
}

export interface Game {
    _id?: string;
    name: string;
    isVisible: boolean;
    mapSize: Coordinate;
    startTiles: Coordinate[];
    attributeItem1: Coordinate;
    attributeItem2: Coordinate;
    conditionItem1: Coordinate;
    conditionItem2: Coordinate;
    functionItem1: Coordinate;
    functionItem2: Coordinate;
    waterTiles: Coordinate[];
    iceTiles: Coordinate[];
    wallTiles: Coordinate[];
    doorTiles: DoorTile[];
}

