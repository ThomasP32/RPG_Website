import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ImageService } from '@app/services/image/image.service';
import { MapCounterService } from '@app/services/map-counter/map-counter.service';
import { MapService } from '@app/services/map/map.service';
import { ScreenShotService } from '@app/services/screenshot/screenshot.service';
import { TileService } from '@app/services/tile/tile.service';
import { Cell } from '@common/map-cell';
import { ItemCategory, Map, TileCategory } from '@common/map.types';
@Component({
    selector: 'app-map-area',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './map-area.component.html',
    styleUrl: './map-area.component.scss',
})
export class MapAreaComponent implements OnInit {
    selectedTile: string;
    map: Cell[][];

    currentDraggedItem: { rowIndex: number; colIndex: number } | null = null;

    isPlacing: boolean = false;
    isMouseDown: boolean = false;
    isRightClickDown = false;

    defaultTile = TileCategory.Floor;
    randomItemCounter: number;
    startingPointCounter: number;
    itemsCounter: number;

    constructor(
        private tileService: TileService,
        public route: ActivatedRoute,
        private mapService: MapService,
        private mapCounterService: MapCounterService,
        private imageService: ImageService,
        private router: Router,
        private screenshotService: ScreenShotService,
    ) {
        this.tileService = tileService;
        this.mapService = mapService;
        this.mapCounterService = mapCounterService;
        this.imageService = imageService;
        this.router = router;
        this.screenshotService = screenshotService;
        this.route = route;
    }

    ngOnInit() {
        this.initMap();
    }

    initMap() {
        this.mapCounterService.startingPointCounter$.subscribe((counter) => (this.startingPointCounter = counter));
        if (this.isCreationMode()) {
            this.initializeCreationMode();
        } else if (this.isEditionMode()) {
            this.initializeEditionMode();
        }
        this.mapService.updateSelectedTile$.subscribe((tile) => (this.selectedTile = tile));
        this.mapService.removeStartingPoint$.subscribe((boolean) => {
            this.removeStartingPoint(boolean);
        });
    }

    isCreationMode(): boolean {
        return this.router.url.includes('creation');
    }

    isEditionMode(): boolean {
        return this.router.url.includes('edition');
    }

    initializeCreationMode() {
        this.createMap(this.mapService.map.mapSize.x);
        this.setCountersBasedOnMapSize(this.mapService.map.mapSize.x);
    }

    initializeEditionMode() {
        this.setCountersBasedOnMapSize(this.mapService.map.mapSize.x);
        this.startingPointCounter -= this.mapService.map.startTiles.length;
        this.mapCounterService.updateStartingPointCounter(this.startingPointCounter);
        this.loadMap(this.mapService.map);
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

    selectTile(tile: string) {
        this.selectedTile = tile;
    }

    startPlacingTile(rowIndex: number, colIndex: number, isRightClick: boolean = false) {
        this.isMouseDown = true;
        if (isRightClick) {
            this.isRightClickDown = true;
            this.tileService.eraseTile(this.map, rowIndex, colIndex, this.defaultTile);
        } else {
            this.isPlacing = true;
            this.tileService.placeTile(this.map, rowIndex, colIndex, this.selectedTile);
        }
    }

    stopPlacing() {
        this.isMouseDown = false;
        this.isPlacing = false;
        this.isRightClickDown = false;
    }

    @HostListener('document:mouseup', ['$event'])
    onMouseUp() {
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
                this.tileService.eraseTile(this.map, rowIndex, colIndex, this.defaultTile);
            } else if (this.selectedTile) {
                this.tileService.placeTile(this.map, rowIndex, colIndex, this.selectedTile);
            }
        }
    }

    startDrag(event: DragEvent, rowIndex: number, colIndex: number) {
        const cell = this.map[rowIndex][colIndex];

        if (cell.isStartingPoint) {
            this.currentDraggedItem = { rowIndex, colIndex };

            event.dataTransfer?.setData('isStartingPoint', 'true');
        } else {
            event.preventDefault();
        }
    }

    allowDrop(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent, rowIndex: number, colIndex: number) {
        const isStartingPoint = event.dataTransfer?.getData('isStartingPoint');
        if (isStartingPoint) {
            const targetTile = this.map[rowIndex][colIndex];

            if (targetTile.tileType === TileCategory.Wall || targetTile.isStartingPoint) {
                event.preventDefault();
                return;
            }
            if (this.currentDraggedItem) {
                this.tileService.moveItem(this.map, this.currentDraggedItem, { rowIndex, colIndex });
                this.currentDraggedItem = null;
            }
            this.tileService.setStartingPoint(this.map, rowIndex, colIndex);
        }
        this.selectedTile = '';
        event.preventDefault();
    }

    removeStartingPoint(isRemoving: boolean) {
        if (isRemoving && this.currentDraggedItem) {
            this.tileService.removeStartingPoint(this.map, this.currentDraggedItem.rowIndex, this.currentDraggedItem.colIndex);
        }
        this.currentDraggedItem = null;
    }

    resetMapToDefault() {
        if (this.route.snapshot.params['mode']) {
            for (let i = 0; i < this.map.length; i++) {
                for (let j = 0; j < this.map[i].length; j++) {
                    this.map[i][j].tileType = this.defaultTile;
                    this.map[i][j].item = undefined;
                }
            }
            this.setCountersBasedOnMapSize(this.mapService.map.mapSize.x);
        } else {
            this.setCountersBasedOnMapSize(this.mapService.map.mapSize.x);
            this.loadMap(this.mapService.map);
        }
    }

    generateMap() {
        this.mapService.generateMapFromEdition(this.map);
    }

    getTileImage(tileType: TileCategory, rowIndex: number, colIndex: number): string {
        return this.imageService.getTileImage(tileType, rowIndex, colIndex, this.map);
    }

    getItemImage(item: ItemCategory): string {
        return this.imageService.getItemImage(item);
    }

    getStartingPointImage(): string {
        return this.imageService.getStartingPointImage();
    }

    setCountersBasedOnMapSize(mapSize: number) {
        const counters = this.getCountersForMapSize(mapSize);
        this.randomItemCounter = counters.randomItemCounter;
        this.startingPointCounter = counters.startingPointCounter;
        this.itemsCounter = counters.itemsCounter;
        this.mapCounterService.updateStartingPointCounter(this.startingPointCounter);
    }

    getCountersForMapSize(mapSize: number) {
        const sizeToCounters: Record<10 | 15 | 20, { randomItemCounter: number; startingPointCounter: number; itemsCounter: number }> = {
            10: { randomItemCounter: 2, startingPointCounter: 2, itemsCounter: 10 },
            15: { randomItemCounter: 4, startingPointCounter: 4, itemsCounter: 14 },
            20: { randomItemCounter: 6, startingPointCounter: 6, itemsCounter: 18 },
        };
        return sizeToCounters[mapSize as 10 | 15 | 20] || { randomItemCounter: 0, startingPointCounter: 0, itemsCounter: 0 };
    }

    async screenMap() {
        await this.screenshotService.captureAndConvert('screenshot-container').then((result: string) => {
            this.mapService.map.imagePreview = result;
        });
    }

    loadMap(loadedmap: Map) {
        this.createMap(loadedmap.mapSize.x);

        loadedmap.tiles.forEach((tile) => {
            this.map[tile.coordinate.x][tile.coordinate.y].tileType = tile.category;
        });

        loadedmap.doorTiles.forEach((door) => {
            this.map[door.coordinate.x][door.coordinate.y].door.isDoor = true;
            this.map[door.coordinate.x][door.coordinate.y].door.isOpen = door.isOpened;
        });
        loadedmap.startTiles.forEach((start) => {
            this.map[start.coordinate.x][start.coordinate.y].isStartingPoint = true;
        });

        loadedmap.items.forEach((item) => {
            this.map[item.coordinate.x][item.coordinate.y].item = item.category;
        });
    }
}
