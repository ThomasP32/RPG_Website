import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, Input, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapService } from '@app/services/map.service';
import { Map, TileCategory } from '@common/map.types';
@Component({
    selector: 'app-map-area',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './map-area.component.html',
    styleUrl: './map-area.component.scss',
})
export class MapAreaComponent {
    @Input() selectedTile: string = '';
    Map: { value: string | null; isHovered: boolean; doorState?: 'open' | 'closed' }[][] = [];
    isPlacing: boolean = false;
    isErasing: boolean = false;
    defaultTile = 'floor';
    mapSize: string;
    mode: string;
    convertedMapSize: number;
    convertedCellSize: number;
    convertedMode: string;

    startingPointCounter: number;

    constructor(
        private route: ActivatedRoute,
        private renderer: Renderer2,
        private cdRef: ChangeDetectorRef,
        private mapService: MapService,
    ) {}

    ngOnInit() {
        this.getUrlParams();
        this.urlConverter(this.mapSize);
        this.createMap(this.convertedMapSize, this.mode);
        this.setCellSize();

        this.mapService.startingPointCounter$.subscribe((counter) => {
            this.startingPointCounter = counter;
        });
    }

    createMap(mapSize: number, mode: string) {
        this.Map = [];

        for (let i = 0; i < mapSize; i++) {
            const row: { value: string | null; isHovered: boolean }[] = [];
            for (let j = 0; j < mapSize; j++) {
                row.push({ value: 'grass', isHovered: false });
            }
            this.Map.push(row);
        }
    }

    setCellSize() {
        const root = document.querySelector(':root') as HTMLElement;
        this.renderer.setStyle(root, '--cell-size', `${this.convertedCellSize}px`);
        console.log('cellsize =', this.convertedCellSize);
        this.cdRef.detectChanges();
    }

    selectTile(tile: string) {
        this.selectedTile = tile;
        // console.log('Selected tile:', tile);
    }

    // Handles left-click or right-click on the map
    startPlacingTile(rowIndex: number, colIndex: number, isRightClick: boolean = false) {
        if (isRightClick) {
            this.isErasing = true;
            this.placeTile(rowIndex, colIndex, true); // Right-click to erase
        } else {
            this.isPlacing = true;
            this.placeTile(rowIndex, colIndex, false); // Left-click to place
        }
    }

    stopPlacingTile() {
        this.isPlacing = false;
        this.isErasing = false;
    }

    @HostListener('document:mouseup', ['$event'])
    onMouseUp(event: MouseEvent) {
        this.stopPlacingTile();
    }

    placeTileOnMove(rowIndex: number, colIndex: number) {
        if (this.isPlacing) {
            this.placeTile(rowIndex, colIndex, false);
        } else if (this.isErasing) {
            this.placeTile(rowIndex, colIndex, true);
        }
    }

    placeTile(rowIndex: number, colIndex: number, isErasing: boolean) {
        // Case 1: If no tile is selected
        if (!this.selectedTile || this.selectedTile === 'empty') {
            // If left-click on a door, toggle the door's state
            if (!isErasing && this.Map[rowIndex][colIndex].value === 'door') {
                const currentState = this.Map[rowIndex][colIndex].doorState;
                this.Map[rowIndex][colIndex].doorState = currentState === 'closed' ? 'open' : 'closed';
                console.log(`Toggled door state at [${rowIndex}, ${colIndex}] to: ${this.Map[rowIndex][colIndex].doorState}`);
            }
            // If right-click, place the default (floor) tile
            else if (isErasing) {
                this.Map[rowIndex][colIndex].value = this.defaultTile;
                console.log(`Replaced with floor at [${rowIndex}, ${colIndex}]`);
            }
            return; // Exit early when no tile is selected
        }

        // Case 2: Handle door-specific logic when selectedTile is 'door'
        if (this.selectedTile === 'door' && !isErasing) {
            if (this.Map[rowIndex][colIndex].value === 'door') {
                const currentState = this.Map[rowIndex][colIndex].doorState;
                this.Map[rowIndex][colIndex].doorState = currentState === 'closed' ? 'open' : 'closed';
                console.log(`Toggled door state at [${rowIndex}, ${colIndex}] to: ${this.Map[rowIndex][colIndex].doorState}`);
            } else {
                this.Map[rowIndex][colIndex].value = 'door';
                this.Map[rowIndex][colIndex].doorState = 'closed';
                console.log(`Placed a closed door at [${rowIndex}, ${colIndex}]`);
            }
        } else {
            // Case 3: Handle erasing or placing other tiles
            const tileToPlace = isErasing ? this.defaultTile : this.selectedTile;

            if (isErasing) {
                // Erasing mode: replace the current tile with the default tile
                this.Map[rowIndex][colIndex].value = this.defaultTile;
                console.log(`Erased tile at [${rowIndex}, ${colIndex}], replaced with default "${this.defaultTile}"`);
            } else if (this.Map[rowIndex][colIndex].value !== tileToPlace) {
                // Place the selected tile (if different from the current one)
                this.Map[rowIndex][colIndex].value = tileToPlace;
                console.log(`Placed tile "${tileToPlace}" at [${rowIndex}, ${colIndex}]`);
            }
        }
    }

    allowDrop(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent, rowIndex: number, colIndex: number) {
        const itemType = event.dataTransfer?.getData('item');

        if (itemType === 'starting-point' && this.startingPointCounter > 0) {
            this.Map[rowIndex][colIndex].value = 'starting-point';
            this.mapService.updateStartingPointCounter(this.startingPointCounter - 1);
            this.selectedTile = 'empty';
            console.log('Starting point placed at:', rowIndex, colIndex);
        }
    }

    resetMapToDefault() {
        for (let i = 0; i < this.Map.length; i++) {
            for (let j = 0; j < this.Map[i].length; j++) {
                this.Map[i][j].value = this.defaultTile;
            }
        }
        console.log('Map has been reset to default');
    }

    public generateMapData(): Map {
        const mapData: Map = {
            name: 'Test-1234',
            isVisible: true,
            mapSize: {
                x: this.convertedMapSize,
                y: this.convertedMapSize,
            },
            tiles: [] as { coordinate: { x: number; y: number }; category: TileCategory }[],
            doorTiles: [] as { coordinate: { x: number; y: number }; isOpened: boolean }[],
            items: [] as any[],
            startTiles: [] as any[],
        };

        for (let rowIndex = 0; rowIndex < this.Map.length; rowIndex++) {
            for (let colIndex = 0; colIndex < this.Map[rowIndex].length; colIndex++) {
                const cell = this.Map[rowIndex][colIndex];
                const coordinate = { x: rowIndex, y: colIndex };

                if (cell && cell.value) {
                    if (cell.value === 'door') {
                        mapData.doorTiles.push({
                            coordinate,
                            isOpened: cell.doorState === 'open',
                        });
                    } else if (['water', 'ice', 'wall', 'floor'].includes(cell.value)) {
                        mapData.tiles.push({
                            coordinate,
                            category: cell.value as TileCategory,
                        });
                    }
                }
            }
        }

        return mapData;
    }

    getTileImage(tileValue: string, rowIndex: number, colIndex: number): string {
        switch (tileValue) {
            case 'door':
                const doorState = this.Map[rowIndex][colIndex].doorState;
                return doorState === 'open' ? '../../../../assets/tiles/door_x.png' : '../../../../assets/tiles/door_y.png';
            case 'wall':
                return '../../../../assets/tiles/wall.png';
            case 'ice':
                return '../../../../assets/tiles/ice1.jpg';
            case 'water':
                return '../../../../assets/tiles/water.png';
            case 'starting-point':
                return '../../../../assets/tiles/startingpoint.png';
            default:
                return '../../../../assets/tiles/floor.png';
        }
    }
    //TODO: PUT it in a service, same as in toolbar.component.ts
    getUrlParams() {
        this.route.queryParams.subscribe((params) => {
            this.mapSize = this.route.snapshot.params['size'];
        });
    }

    urlConverter(size: string) {
        console.log('URL params:', size);
        this.convertedMapSize = parseInt(size.split('=')[1]);
        console.log('Converted map size:', this.convertedMapSize);
    }
}
