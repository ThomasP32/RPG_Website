import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output } from '@angular/core';
import { MovesMap } from '@app/interfaces/moves';
import { ImageService } from '@app/services/image/image.service';
import { Avatar, Game } from '@common/game';
import { Coordinate, TileCategory } from '@common/map.types';

@Component({
    selector: 'app-game-map',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-map.component.html',
    styleUrl: './game-map.component.scss',
})
export class GameMapComponent implements OnInit, OnChanges {
    @Input() map: Game;
    @Input() moves: MovesMap;
    @Output() tileClicked = new EventEmitter<Coordinate>();
    movePreview: Coordinate[] = [];
    Map: { value: string; isHovered: boolean; doorState?: 'open' | 'closed'; item?: string; player?: Avatar }[][] = [];
    tileDescription: string = '';
    explanationIsVisible: boolean = false;
    tooltipX: number = 0;
    tooltipY: number = 0;

    constructor(private imageService: ImageService) {
        this.imageService = imageService;
    }

    onTileClick(position: Coordinate) {
        const key = `${position.x},${position.y}`;
        if (this.moves.has(key)) {
            this.tileClicked.emit(position);
        }
    }

    ngOnInit() {
        this.loadMap(this.map);
    }

    ngOnChanges() {
        this.clearPreview();
        this.reloadMap(this.map);
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

    loadMap(map: Game) {
        this.createMap(map.mapSize.x);

        map.tiles.forEach((tile) => {
            this.Map[tile.coordinate.x][tile.coordinate.y].value = tile.category;
        });

        map.doorTiles.forEach((door) => {
            this.Map[door.coordinate.x][door.coordinate.y].value = 'door';
            this.Map[door.coordinate.x][door.coordinate.y].doorState = door.isOpened ? 'open' : 'closed';
        });

        map.startTiles.forEach((start) => {
            this.Map[start.coordinate.x][start.coordinate.y].item = 'starting-point';
        });

        map.items.forEach((item) => {
            this.Map[item.coordinate.x][item.coordinate.y].item = item.category;
        });

        map.players.forEach((player) => {
            this.Map[player.position.x][player.position.y].player = player.avatar;
        });
    }

    reloadMap(map: Game) {
        this.Map.forEach((row) =>
            row.forEach((cell) => {
                cell.player = undefined;
                cell.item = undefined;
                cell.doorState = undefined;
            }),
        );

        map.doorTiles.forEach((door) => {
            this.Map[door.coordinate.x][door.coordinate.y].value = 'door';
            this.Map[door.coordinate.x][door.coordinate.y].doorState = door.isOpened ? 'open' : 'closed';
        });

        map.items.forEach((item) => {
            this.Map[item.coordinate.x][item.coordinate.y].item = item.category;
        });

        map.players.forEach((player) => {
            this.Map[player.position.x][player.position.y].player = player.avatar;
        });
    }

    createMap(mapSize: number) {
        this.Map = [];
        for (let i = 0; i < mapSize; i++) {
            const row: { value: string; isHovered: boolean }[] = [];
            for (let j = 0; j < mapSize; j++) {
                row.push({ value: 'floor', isHovered: false });
            }
            this.Map.push(row);
        }
    }

    getTileImage(tileValue: string, rowIndex: number, colIndex: number): string {
        return this.imageService.getTileImage(tileValue, rowIndex, colIndex, this.Map);
    }

    getItemImage(item: string): string {
        return this.imageService.getItemImage(item);
    }

    getAvatarImage(avatar: Avatar): string {
        return this.imageService.getPlayerImage(avatar);
    }

    isMove(rowIndex: number, colIndex: number): boolean {
        const coordinateKey = `${rowIndex},${colIndex}`;
        const move = this.moves.get(coordinateKey);
        if (move) {
            return true;
        }
        return false;
    }

    isPreview(rowIndex: number, colIndex: number): boolean {
        return this.movePreview.some((coord) => coord.x === rowIndex && coord.y === colIndex);
    }

    onRightClickTile(event: MouseEvent, position: Coordinate) {
        if (event.button === 2) {
            event.preventDefault();
            this.tileDescription = 'Un déplacement sur une tuile de terrain nécessite 1 point de mouvement.';
            this.map.tiles.forEach((tile) => {
                if (tile.category === TileCategory.Water && tile.coordinate.x === position.x && tile.coordinate.y === position.y) {
                    this.tileDescription = "Un déplacement sur une tuile d'eau nécessite 2 points de mouvements.";
                }
                if (tile.category === TileCategory.Ice && tile.coordinate.x === position.x && tile.coordinate.y === position.y) {
                    this.tileDescription =
                        "Un déplacement sur une tuile de glace ne nécessite aucun point de mouvement, mais a un risque de chute qui s'élève à 10%.";
                }
                if (tile.category === TileCategory.Wall && tile.coordinate.x === position.x && tile.coordinate.y === position.y) {
                    this.tileDescription = "Aucun déplacement n'est possible sur ou à travers un mur.";
                }
            });
            this.map.doorTiles.forEach((doorTile) => {
                if (!doorTile.isOpened && doorTile.coordinate.x === position.x && doorTile.coordinate.y === position.y) {
                    this.tileDescription = 'Une porte fermée ne peut être franchie, mais peut être ouverte par une action.';
                }
                if (doorTile.isOpened && doorTile.coordinate.x === position.x && doorTile.coordinate.y === position.y) {
                    this.tileDescription = 'Une porte ouverte peut être franchie, mais peut être fermée par une action.';
                }
            });
            this.tooltipX = event.pageX + 10;
            this.tooltipY = event.pageY + 10;
            this.explanationIsVisible = true;
        }
    }

    @HostListener('window:mouseup', ['$event'])
    onRightClickRelease(event: MouseEvent) {
        if (event.button === 2) {
            console.log('TU TOUCHE PLUS');
            this.explanationIsVisible = false;
            this.tileDescription = '';
        }
    }
}
