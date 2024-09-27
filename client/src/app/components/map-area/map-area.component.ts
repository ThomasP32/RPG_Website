import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, Input, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MapGetService } from '@app/services/map-get.service';
import { MapService } from '@app/services/map.service';
import { ItemCategory, Map, Mode, TileCategory } from '@common/map.types';
@Component({
    selector: 'app-map-area',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './map-area.component.html',
    styleUrl: './map-area.component.scss',
})
export class MapAreaComponent implements OnInit {
    @Input() selectedTile: string = '';
    map!: Map;
    Map: { value: string | null; isHovered: boolean; doorState?: 'open' | 'closed'; item?: string }[][] = [];

    isPlacing: boolean = false;
    isErasing: boolean = false;
    isMouseDown: boolean = false;
    defaultTile = 'floor';
    mapSize: string;
    mode: Mode;
    convertedMapSize: number;
    convertedCellSize: number;
    convertedMode: string;

    startingPointCounter: number;
    randomItemCounter: number;
    itemsCounter: number;

    constructor(
        private route: ActivatedRoute,
        private renderer: Renderer2,
        private cdRef: ChangeDetectorRef,
        private mapService: MapService,
        private mapGetService: MapGetService,
        private router: Router,
    ) {}

    mapTitle: string = '';
    mapDescription: string;

    ngOnInit() {
        this.initMap();
    }

    initMap() {
        console.log(this.router.url);
        if (this.router.url.includes('creation')) {
            this.getUrlParams();
            this.urlConverter(this.mapSize);
            this.createMap(this.convertedMapSize);
            this.setCellSize();
        } else if (this.router.url.includes('edition')) {
            this.map = this.mapGetService.map;
            this.convertedMapSize = this.map.mapSize.x;
            this.loadMap(this.map);
        }

        this.mapService.startingPointCounter$.subscribe((counter) => {
            this.startingPointCounter = counter;
        });

        this.mapService.itemsCounter$.subscribe((counter) => {
            this.itemsCounter = counter;
        });

        this.mapService.mapTitle$.subscribe((title) => {
            this.mapTitle = title;
        });

        this.mapService.mapDescription$.subscribe((description) => {
            this.mapDescription = description;
        });
        this.setCountersBasedOnMapSize(this.convertedMapSize);
    }

    createMap(mapSize: number) {
        this.Map = [];

        for (let i = 0; i < mapSize; i++) {
            const row: { value: string | null; isHovered: boolean }[] = [];
            for (let j = 0; j < mapSize; j++) {
                row.push({ value: 'grass', isHovered: false });
            }
            this.Map.push(row);
        }
    }

    isTileDraggable(rowIndex: number, colIndex: number): boolean {
        return this.Map[rowIndex][colIndex].item === 'starting-point';
    }

    setCellSize() {
        const root = document.querySelector(':root') as HTMLElement;
        this.renderer.setStyle(root, '--cell-size', `${this.convertedCellSize}px`);
        this.cdRef.detectChanges();
    }

    selectTile(tile: string) {
        this.selectedTile = tile;
    }

    startPlacingTile(rowIndex: number, colIndex: number, isRightClick: boolean = false) {
        this.isMouseDown = true;
        if (isRightClick) {
            this.isErasing = true;
            this.placeTile(rowIndex, colIndex, true);
        } else {
            this.isPlacing = true;
            this.placeTile(rowIndex, colIndex, false);
        }
    }

    stopPlacingTile() {
        this.isMouseDown = false;
        this.isPlacing = false;
        this.isErasing = false;
    }

//     @HostListener('document:mouseup', ['$event'])
//     onMouseUp(event: MouseEvent) {
//         this.stopPlacingTile();
//     }

    @HostListener('dragstart', ['$event'])
    onDragStart(event: DragEvent) {
        if ((event.target as HTMLElement).tagName === 'IMG') {
            event.preventDefault();
        }
    }

    placeTileOnMove(rowIndex: number, colIndex: number) {
        if (this.isMouseDown) {
            if (this.isPlacing) {
                this.placeTile(rowIndex, colIndex, false);
            } else if (this.isErasing) {
                this.placeTile(rowIndex, colIndex, true);
            }
        }
    }

    placeTile(rowIndex: number, colIndex: number, isErasing: boolean) {
        if (isErasing) {
            if (this.Map[rowIndex][colIndex].item === 'starting-point') {
                this.Map[rowIndex][colIndex].item = undefined;
                this.mapService.updateStartingPointCounter(this.startingPointCounter + 1);
                console.log('Starting point removed at:', rowIndex, colIndex);
            } else if (this.Map[rowIndex][colIndex].item === 'random') {
                this.Map[rowIndex][colIndex].item = undefined;
                this.mapService.updateRandomItemCounter(this.randomItemCounter + 1);
                console.log('Random item removed at:', rowIndex, colIndex);
            } else if (this.Map[rowIndex][colIndex].item !== undefined) {
                this.Map[rowIndex][colIndex].item = undefined;
                this.mapService.updateItemsCounter(this.itemsCounter - 1);
            }

            this.Map[rowIndex][colIndex].value = this.defaultTile;
        } else if (!this.selectedTile || this.selectedTile === 'empty') {
            if (!isErasing && this.Map[rowIndex][colIndex].value === 'door') {
                const currentState = this.Map[rowIndex][colIndex].doorState;
                this.Map[rowIndex][colIndex].doorState = currentState === 'closed' ? 'open' : 'closed';
                console.log(`Toggled door state at [${rowIndex}, ${colIndex}] to: ${this.Map[rowIndex][colIndex].doorState}`);
            } else if (isErasing) {
                this.Map[rowIndex][colIndex].value = this.defaultTile;
            }
            return;
        }
        if (this.Map[rowIndex][colIndex].item === 'starting-point') {
            if (this.selectedTile === 'wall' || this.selectedTile === 'door') {
                console.log('passing a starting-point');
                this.Map[rowIndex][colIndex].item = undefined;
                this.Map[rowIndex][colIndex].value = this.selectedTile;
            } else {
                this.Map[rowIndex][colIndex].value = this.selectedTile;
            }
        } else if (this.selectedTile === 'door' && !isErasing) {
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
            const tileToPlace = isErasing ? this.defaultTile : this.selectedTile;

            if (isErasing) {
                this.Map[rowIndex][colIndex].value = this.defaultTile;
            } else if (this.Map[rowIndex][colIndex].value !== tileToPlace) {
                this.Map[rowIndex][colIndex].value = tileToPlace;
            }
        }
    }
    currentDraggedItem: { rowIndex: number; colIndex: number } | null = null;

    startDrag(event: DragEvent, rowIndex: number, colIndex: number) {
        if (this.isTileDraggable(rowIndex, colIndex)) {
            this.currentDraggedItem = { rowIndex, colIndex };
            event.dataTransfer?.setData('item', 'starting-point');
            console.log(`Dragging starting point from: [${rowIndex}, ${colIndex}]`);
        } else {
            event.preventDefault();
        }
    }

    allowDrop(event: DragEvent) {
        event.preventDefault();
        console.log('Allowing drop');
    }

    onDrop(event: DragEvent, rowIndex: number, colIndex: number) {
        event.preventDefault();
        const itemType = event.dataTransfer?.getData('item');
        if (itemType === 'starting-point' && this.currentDraggedItem) {
            const { rowIndex: prevRow, colIndex: prevCol } = this.currentDraggedItem;
            this.Map[prevRow][prevCol].item = undefined;
            console.log(`Starting point removed from previous location: [${prevRow}, ${prevCol}]`);

            if (this.Map[rowIndex][colIndex].value === 'floor') {
                this.Map[rowIndex][colIndex].item = 'starting-point';
                console.log(`Starting point placed at new location: [${rowIndex}, ${colIndex}]`);
            } else {
                console.log('Cannot place starting point on non-floor tiles');
            }

            this.currentDraggedItem = null;
        } else if (itemType) {
            if (
                this.Map[rowIndex][colIndex].value === 'wall' ||
                this.Map[rowIndex][colIndex].value === 'water' ||
                this.Map[rowIndex][colIndex].value === 'ice' ||
                this.Map[rowIndex][colIndex].value === 'door'
            ) {
                console.log('Cannot place items on walls, door, water or ice');
                return;
            }
            if (itemType === 'starting-point' && this.startingPointCounter > 0) {
                this.Map[rowIndex][colIndex].item = 'starting-point';
                this.mapService.updateStartingPointCounter(this.startingPointCounter - 1);
                this.selectedTile = 'empty';
                console.log('Starting point placed at:', rowIndex, colIndex);
            } else if (itemType === 'random' && this.randomItemCounter > 0) {
                this.Map[rowIndex][colIndex].item = 'random';
                this.mapService.updateRandomItemCounter(this.randomItemCounter - 1);
                console.log('Random item placed at:', rowIndex, colIndex);
            } else {
                this.Map[rowIndex][colIndex].item = itemType;
                this.Map[rowIndex][colIndex].item = itemType;
                console.log(`${itemType} placed at [${rowIndex}, ${colIndex}]`);
            }
        }
    }

    resetMapToDefault() {
        for (let i = 0; i < this.Map.length; i++) {
            for (let j = 0; j < this.Map[i].length; j++) {
                this.Map[i][j].value = this.defaultTile;
                this.Map[i][j].item = undefined;
            }
        }
        this.setCountersBasedOnMapSize(this.convertedMapSize);
        console.log('Map has been reset to default');
    }

    public generateMapData(): Map {
        const mapData: Map = {
            name: this.mapTitle,
            description: this.mapDescription,
            imagePreview: "url d'image",
            mode: Mode.Ctf,
            // isVisible: false,
            mapSize: {
                x: this.convertedMapSize,
                y: this.convertedMapSize,
            },
            tiles: [] as { coordinate: { x: number; y: number }; category: TileCategory }[],
            doorTiles: [] as { coordinate: { x: number; y: number }; isOpened: boolean }[],
            items: [] as { coordinate: { x: number; y: number }; category: ItemCategory }[],
            startTiles: [] as { coordinate: { x: number; y: number } }[],
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
                    } else if (['water', 'ice', 'wall'].includes(cell.value)) {
                        mapData.tiles.push({
                            coordinate,
                            category: cell.value as TileCategory,
                        });
                    }

                    if (cell.item && cell.item !== '' && cell.item !== 'starting-point') {
                        mapData.items.push({
                            coordinate,
                            category: cell.item as ItemCategory,
                        });
                    }

                    if (cell.item === 'starting-point') {
                        mapData.startTiles.push({
                            coordinate,
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
            default:
                return '../../../../assets/tiles/floor.png';
        }
    }

    getItemImage(item: string): string {
        switch (item) {
            case 'vest':
                return '../../../../assets/items/vest.png';
            case 'mask':
                return '../../../../assets/items/mask.png';
            case 'jar':
                return '../../../../assets/items/jar.png';
            case 'acidgun':
                return '../../../../assets/items/acidgun.png';
            case 'key':
                return '../../../../assets/items/keysilver.png';
            case 'hat':
                return '../../../../assets/items/hat.png';
            case 'random':
                return '../../../../assets/items/randomchest.png';
            case 'starting-point':
                return '../../../../assets/tiles/startingpoint.png';
            default:
                return '';
        }
    }

    setCountersBasedOnMapSize(mapSize: number) {
        if (mapSize === 10) {
            this.randomItemCounter = 2;
            this.startingPointCounter = 2;
            this.itemsCounter = 10;
        } else if (mapSize === 15) {
            this.randomItemCounter = 4;
            this.startingPointCounter = 4;
            this.itemsCounter = 14;
        } else if (mapSize === 20) {
            this.randomItemCounter = 6;
            this.startingPointCounter = 6;
            this.itemsCounter = 18;
        }
        this.mapService.updateRandomItemCounter(this.randomItemCounter);
        this.mapService.updateStartingPointCounter(this.startingPointCounter);
        this.mapService.updateItemsCounter(this.itemsCounter);

        console.log(`Map size: ${mapSize}, Random items: ${this.randomItemCounter}, Starting points: ${this.startingPointCounter}`);
    }
    getUrlParams() {
        this.route.queryParams.subscribe((params) => {
            this.mapSize = this.route.snapshot.params['size'];
        });
    }

    urlConverter(size: string) {
        if (size) {
            console.log('URL params:', size);
            this.convertedMapSize = parseInt(size.split('=')[1]);
            console.log('Converted map size:', this.convertedMapSize);
        }
    }

    loadMap(map: Map) {
        console.log('Loading map:', map);
        this.createMap(map.mapSize.x);

        map.tiles.forEach((tile) => {
            this.Map[tile.coordinate.x][tile.coordinate.y].value = tile.category;
        });

        map.doorTiles.forEach((door) => {
            this.Map[door.coordinate.x][door.coordinate.y].value = 'door';
            this.Map[door.coordinate.x][door.coordinate.y].doorState = door.isOpened ? 'open' : 'closed';
        });

        map.startTiles.forEach((start) => {
            this.Map[start.coordinate.x][start.coordinate.y].value = 'starting-point';
        });

        map.items.forEach((item) => {
            this.Map[item.coordinate.x][item.coordinate.y].value = 'item';
        });
    }
}
