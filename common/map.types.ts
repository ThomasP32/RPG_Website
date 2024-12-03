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
    Amulet = 'amulet',
    Random = 'randomitem',
    Flag = 'flag',
    StartingPoint = 'startingPoint',
}

export enum GameDescriptions {
    Amulet = "Amulette de Résilience : Augmente votre vitalité de 2 lorsque vous affrontez un adversaire avec plus d'attaque.",
    Armor = 'Armure Renforcée : +2 en défense, mais réduit votre vitesse de 1. Conçue pour les stratèges prudents.',
    Flag = 'Drapeau de Victoire : Capturez-le et ramenez-le à votre point de départ pour triompher.',
    IceSkates = 'Patins Stabilisateurs : Immunisé aux chutes et pénalités sur glace. Glissez avec maîtrise.',
    Sword = "Lame d'Agilité : +2 en attaque et +1 en vitesse. Parfait pour un combat rapide et décisif.",
    WallBreaker = 'Destructeur de Murs : Détruit instantanément tous les murs adjacents. Ouvrez votre chemin avec style.',
    Flask = 'Potion de Résurrection : Lorsque vous tombez à 2 vies en combat, gagnez un boost de +2 en attaque pour un dernier effort héroïque.',
    Random = 'Une boîte mystère contenant un objet aléatoire. Qui sait ce que vous trouverez ?',

    WaterTile = "Un déplacement sur une tuile d'eau nécessite 2 points de mouvements.",
    IceTile = "Un déplacement sur une tuile de glace ne nécessite aucun point de mouvement, mais a un risque de chute qui s'élève à 10%.",
    WallTile = "Aucun déplacement n'est possible sur ou à travers un mur.",
    FloorTile = 'Un déplacement sur une tuile de terrain nécessite 1 point de mouvement.',

    ClosedDoor = 'Une porte fermée ne peut être franchie, mais peut être ouverte par une action.',
    OpenedDoor = 'Une porte ouverte peut être franchie, mais peut être fermée par une action.',
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
