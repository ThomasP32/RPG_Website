import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output } from '@angular/core';
import { ImageService } from '@app/services/image/image.service';
import { MovesMap } from '@common/directions';
import { Avatar, Game } from '@common/game';
import { Cell } from '@common/map-cell';
import { Coordinate, ItemCategory, TileCategory } from '@common/map.types';

@Component({
    selector: 'app-game-map',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-map.component.html',
    styleUrl: './game-map.component.scss',
})
export class GameMapComponent implements OnInit, OnChanges {
    @Input() loadedMap: Game;
    @Input() moves: MovesMap;
    @Output() tileClicked = new EventEmitter<Coordinate>();
    @Input() isYourTurn: boolean;
    movePreview: Coordinate[] = [];
    map: Cell[][];
    tileDescription: string = '';
    explanationIsVisible: boolean = false;
    tooltipX: number = 0;
    tooltipY: number = 0;

    constructor(private readonly imageService: ImageService) {
        this.imageService = imageService;
    }

    onTileClick(position: Coordinate) {
        const key = `${position.x},${position.y}`;
        if (this.moves.has(key)) {
            this.tileClicked.emit(position);
        }
    }

    ngOnInit() {
        this.loadMap(this.loadedMap);
    }

    ngOnChanges() {
        this.clearPreview();
        this.loadMap(this.loadedMap);
    }

    onTileHover(position: Coordinate) {
        const coordinateKey = `${position.x},${position.y}`;
        const move = this.moves.get(coordinateKey);
        if (move) {
            this.movePreview = move.path;
        } else {
            this.clearPreview();
        }
    }

    clearPreview() {
        this.movePreview = [];
    }

    loadMap(loadedMap: Game) {
        this.createMap(loadedMap.mapSize.x);

        loadedMap.tiles.forEach((tile) => {
            this.map[tile.coordinate.x][tile.coordinate.y].tileType = tile.category;
        });

        loadedMap.doorTiles.forEach((door) => {
            this.map[door.coordinate.x][door.coordinate.y].tileType = TileCategory.Door;
            this.map[door.coordinate.x][door.coordinate.y].door.isDoor = true;
            this.map[door.coordinate.x][door.coordinate.y].door.isOpen = door.isOpened;
        });
        loadedMap.startTiles.forEach((start) => {
            this.map[start.coordinate.x][start.coordinate.y].isStartingPoint = true;
        });

        loadedMap.items.forEach((item) => {
            this.map[item.coordinate.x][item.coordinate.y].item = item.category;
        });

        loadedMap.players.forEach((player) => {
            if (player.isActive) {
                this.map[player.position.x][player.position.y].player = player;
            }
        });
    }

    createMap(mapSize: number) {
        this.map = [];
        for (let i = 0; i < mapSize; i++) {
            const row: Cell[] = [];
            for (let j = 0; j < mapSize; j++) {
                row.push({
                    coordinate: { x: i, y: j },
                    tileType: TileCategory.Floor,
                    door: { isOpen: false, isDoor: false },
                    isHovered: false,
                    isOccupied: false,
                    isStartingPoint: false,
                });
            }
            this.map.push(row);
        }
    }
    getTileImage(tileValue: TileCategory, rowIndex: number, colIndex: number): string {
        return this.imageService.getTileImage(tileValue, rowIndex, colIndex, this.map);
    }

    getStartingPointImage(): string {
        return this.imageService.getStartingPointImage();
    }

    getItemImage(item: ItemCategory): string {
        return this.imageService.getItemImage(item);
    }

    getAvatarImage(avatar: Avatar): string {
        return this.imageService.getPixelatedPlayerImage(avatar);
    }

    isMove(rowIndex: number, colIndex: number): boolean {
        const coordinateKey = `${rowIndex},${colIndex}`;
        const move = this.moves.get(coordinateKey);
        return move !== undefined;
    }

    isPreview(rowIndex: number, colIndex: number): boolean {
        return this.movePreview.some((coord) => coord.x === rowIndex && coord.y === colIndex);
    }

    onRightClickTile(event: MouseEvent, position: Coordinate) {
        if (event.button === 2) {
            event.preventDefault();
            this.tileDescription = this.getTileDescription(position);
            this.tooltipX = event.pageX + 10;
            this.tooltipY = event.pageY + 10;
            this.explanationIsVisible = true;
        }
    }

    private getTileDescription(position: Coordinate): string {
        const terrainDescription = this.getNormalTileDescription(position);
        if (terrainDescription) {
            return terrainDescription;
        }

        const doorDescription = this.getDoorDescription(position);
        if (doorDescription) {
            return doorDescription;
        }

        const playerDescription = this.getPlayerDescription(position);
        if (playerDescription) {
            return playerDescription;
        }

        return 'Un déplacement sur une tuile de terrain nécessite 1 point de mouvement.';
    }

    private getNormalTileDescription(position: Coordinate): string | null {
        for (const tile of this.loadedMap.tiles) {
            if (tile.coordinate.x === position.x && tile.coordinate.y === position.y) {
                switch (tile.category) {
                    case TileCategory.Water:
                        return "Un déplacement sur une tuile d'eau nécessite 2 points de mouvements.";
                    case TileCategory.Ice:
                        return "Un déplacement sur une tuile de glace ne nécessite aucun point de mouvement, mais a un risque de chute qui s'élève à 10%.";
                    case TileCategory.Wall:
                        return "Aucun déplacement n'est possible sur ou à travers un mur.";
                }
            }
        }
        return null;
    }

    private getDoorDescription(position: Coordinate): string | null {
        for (const doorTile of this.loadedMap.doorTiles) {
            if (doorTile.coordinate.x === position.x && doorTile.coordinate.y === position.y) {
                if (!doorTile.isOpened) {
                    return 'Une porte fermée ne peut être franchie, mais peut être ouverte par une action.';
                }
                if (doorTile.isOpened) {
                    return 'Une porte ouverte peut être franchie, mais peut être fermée par une action.';
                }
            }
        }
        return null;
    }

    private getPlayerDescription(position: Coordinate): string | null {
        for (const player of this.loadedMap.players) {
            if (player.position.x === position.x && player.position.y === position.y) {
                return `nom du joueur: ${player.name}`;
            }
        }
        return null;
    }

    @HostListener('window:mouseup', ['$event'])
    onRightClickRelease(event: MouseEvent) {
        if (event.button === 2) {
            this.explanationIsVisible = false;
            this.tileDescription = '';
        }
    }

    rowByIndex(index: number) {
        return index;
    }

    cellByIndex(index: number) {
        return index;
    }
}
