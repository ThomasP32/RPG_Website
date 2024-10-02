import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ImageService } from '@app/services/image.service';
import { MapCounterService } from '@app/services/map-counter.service';
import { MapGetService } from '@app/services/map-get.service';
import { MapService } from '@app/services/map.service';
import { ScreenShotService } from '@app/services/screenshot/screenshot.service';
import { TileService } from '@app/services/tile.service';
import { ItemCategory, Map, Mode, TileCategory } from '@common/map.types';

@Component({
    selector: 'app-map-area',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './map-area.component.html',
    styleUrl: './map-area.component.scss',
})
export class MapAreaComponent implements OnInit {
    selectedTile: string;
    map!: Map;
    Map: { value: string | null; isHovered: boolean; doorState?: 'open' | 'closed'; item?: string }[][] = [];
    imagePreviewUrl: string = '';

    isPlacing: boolean = false;
    isMouseDown: boolean = false;
    isRightClickDown = false;

    currentDraggedItem: { rowIndex: number; colIndex: number } | null = null;

    defaultTile = 'floor';
    mapSize: string;
    mode: Mode;
    convertedMapSize: number;
    convertedCellSize: number;
    convertedMode: string;

    randomItemCounter: number;
    startingPointCounter: number;
    itemsCounter: number;

    constructor(
        private tileService: TileService,
        private route: ActivatedRoute,
        private renderer: Renderer2,
        private cdRef: ChangeDetectorRef,
        private mapService: MapService,
        private mapGetService: MapGetService,
        private mapCounterService: MapCounterService,
        private imageService: ImageService,
        private router: Router,
        private screenshotService: ScreenShotService,
    ) {}

    mapTitle: string = '';
    mapDescription: string;

    ngOnInit() {
        this.initMap();
    }

    initMap() {
        if (this.router.url.includes('creation')) {
            this.getUrlParams();
            this.urlConverter();
            this.createMap(this.convertedMapSize);
            this.setCellSize();
        } else if (this.router.url.includes('edition')) {
            this.map = this.mapGetService.map;
            this.convertedMapSize = this.map.mapSize.x;
            this.mode = this.map.mode;
            this.loadMap(this.map);
        }

        this.setCountersBasedOnMapSize(this.convertedMapSize);

        this.mapCounterService.startingPointCounter$.subscribe((counter) => {
            this.startingPointCounter = counter;
        });

        this.mapCounterService.itemsCounter$.subscribe((counter) => {
            this.itemsCounter = counter;
        });

        this.mapService.mapTitle$.subscribe((title) => {
            this.mapTitle = title;
        });

        this.mapService.mapDescription$.subscribe((description) => {
            this.mapDescription = description;
        });
        this.mapService.updateSelectedTile$.subscribe((tile) => {
            this.selectedTile = tile;
        });
    }

    createMap(mapSize: number) {
        this.Map = [];

        for (let i = 0; i < mapSize; i++) {
            const row: { value: string | null; isHovered: boolean }[] = [];
            for (let j = 0; j < mapSize; j++) {
                row.push({ value: 'floor', isHovered: false });
            }
            this.Map.push(row);
        }
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
            this.isRightClickDown = true;
            this.tileService.eraseTile(this.Map, rowIndex, colIndex, this.defaultTile);
        } else {
            this.isPlacing = true;
            this.tileService.placeTile(this.Map, rowIndex, colIndex, this.selectedTile);
        }
    }

    stopPlacing() {
        this.isMouseDown = false;
        this.isPlacing = false;
        this.isRightClickDown = false;
    }

    @HostListener('document:mouseup', ['$event'])
    onMouseUp(event: MouseEvent) {
        this.stopPlacing();
    }

    @HostListener('dragstart', ['$event'])
    onDragStart(event: DragEvent) {
        const targetElement = event.target as HTMLElement;

        if (targetElement.tagName === 'IMG') {
            const tileElement = targetElement.closest('.grid-item');

            if (!tileElement) {
                event.preventDefault();
            }
        }
    }

    placeTileOnMove(rowIndex: number, colIndex: number) {
        if (this.isMouseDown) {
            if (this.isRightClickDown) {
                this.tileService.eraseTile(this.Map, rowIndex, colIndex, this.defaultTile);
            } else if (this.selectedTile) {
                this.tileService.placeTile(this.Map, rowIndex, colIndex, this.selectedTile);
            }
        }
    }

    startDrag(event: DragEvent, rowIndex: number, colIndex: number) {
        const cell = this.Map[rowIndex][colIndex];

        if (cell.item) {
            this.currentDraggedItem = { rowIndex, colIndex };

            event.dataTransfer?.setData('item', cell.item);
        } else {
            event.preventDefault();
        }
    }

    allowDrop(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent, rowIndex: number, colIndex: number) {
        const itemType = event.dataTransfer?.getData('item');
        if (itemType === 'starting-point') {
            if (this.currentDraggedItem) {
                this.tileService.moveItem(this.Map, this.currentDraggedItem, { rowIndex, colIndex });
                this.currentDraggedItem = null;
                event.preventDefault();
            } else {
                this.tileService.setItem(this.Map, itemType, { rowIndex, colIndex });
                this.mapCounterService.updateCounters(itemType, 'remove');
            }
        }
        this.selectedTile = '';
    }

    resetMapToDefault() {
        if (this.route.snapshot.params['mode']) {
            for (let i = 0; i < this.Map.length; i++) {
                for (let j = 0; j < this.Map[i].length; j++) {
                    this.Map[i][j].value = this.defaultTile;
                    this.Map[i][j].item = undefined;
                }
            }
            this.setCountersBasedOnMapSize(this.convertedMapSize);
        } else {
            this.loadMap(this.map);
        }
    }

    generateMapData(): Map {
        const mapData: Map = {
            name: this.mapTitle,
            description: this.mapDescription,
            imagePreview: this.imagePreviewUrl,
            mode: this.mode,
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
        return this.imageService.getTileImage(tileValue, rowIndex, colIndex, this.Map);
    }

    getItemImage(item: string): string {
        return this.imageService.getItemImage(item);
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
        this.mapCounterService.updateRandomItemCounter(this.randomItemCounter);
        this.mapCounterService.updateStartingPointCounter(this.startingPointCounter);
        this.mapCounterService.updateItemsCounter(this.itemsCounter);
    }
    getUrlParams() {
        this.route.queryParams.subscribe((params) => {
            this.mapSize = this.route.snapshot.params['size'];
            this.mode = this.route.snapshot.params['mode'];
        });
    }

    urlConverter() {
        this.convertedMode = this.mode.split('=')[1];
        this.convertedMapSize = parseInt(this.mapSize.split('=')[1]);

        if (this.convertedMode === 'classic') {
            this.mode = Mode.Classic;
        } else {
            this.mode = Mode.Ctf;
        }
    }

    async screenMap() {
        await this.screenshotService.captureAndUpload('screenshot-container').then((result: string) => {
            this.imagePreviewUrl = result;
        });
    }

    loadMap(map: Map) {
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
    }
}
