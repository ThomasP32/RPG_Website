import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output } from '@angular/core';
import { GameInfosService } from '@app/services/game-infos.service';
import { ImageService } from '@app/services/image/image.service';
import { RIGHT_CLICK, TOOLTIP_DIRECTION_CHANGE } from '@common/constants';
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

    constructor(
        private readonly imageService: ImageService,
        private readonly gameInfosService: GameInfosService,
    ) {
        this.imageService = imageService;
        this.gameInfosService = gameInfosService;
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
            this.tileDescription = this.gameInfosService.getTileDescription(position, this.loadedMap);
            this.tooltipX = event.pageX + TOOLTIP_DIRECTION_CHANGE;
            this.tooltipY = event.pageY + TOOLTIP_DIRECTION_CHANGE;
            this.explanationIsVisible = true;
        }
    }

    @HostListener('window:mouseup', ['$event'])
    onRightClickRelease(event: MouseEvent) {
        if (event.button === RIGHT_CLICK) {
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
