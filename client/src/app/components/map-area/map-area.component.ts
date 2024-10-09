import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ImageService } from '@app/services/image.service';
import { MapCounterService } from '@app/services/map-counter.service';
import { MapService } from '@app/services/map.service';
import { ScreenShotService } from '@app/services/screenshot/screenshot.service';
import { TileService } from '@app/services/tile.service';
import { ItemCategory, Map, TileCategory } from '@common/map.types';
/* eslint-disable no-unused-vars */
@Component({
    selector: 'app-map-area',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './map-area.component.html',
    styleUrl: './map-area.component.scss',
})
export class MapAreaComponent implements OnInit {
    selectedTile: string;
    Map: { value: string | null; isHovered: boolean; doorState?: 'open' | 'closed'; item?: string }[][] = [];

    isPlacing: boolean = false;
    isMouseDown: boolean = false;
    isRightClickDown = false;

    currentDraggedItem: { rowIndex: number; colIndex: number } | null = null;

    defaultTile = 'floor';
    randomItemCounter: number;
    startingPointCounter: number;
    itemsCounter: number;

    constructor(
        private tileService: TileService,
        private route: ActivatedRoute,
        private mapService: MapService,
        private mapCounterService: MapCounterService,
        private imageService: ImageService,
        private router: Router,
        private screenshotService: ScreenShotService,
    ) {}
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
        this.Map = [];

        for (let i = 0; i < mapSize; i++) {
            const row: { value: string | null; isHovered: boolean }[] = [];
            for (let j = 0; j < mapSize; j++) {
                row.push({ value: 'floor', isHovered: false });
            }
            this.Map.push(row);
        }
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
            this.setCountersBasedOnMapSize(this.mapService.map.mapSize.x);
        } else {
            this.loadMap(this.mapService.map);
        }
    }

    generateMap() {
        this.mapService.map.doorTiles = [];
        this.mapService.map.tiles = [];
        this.mapService.map.items = [];
        this.mapService.map.startTiles = [];

        for (let rowIndex = 0; rowIndex < this.Map.length; rowIndex++) {
            for (let colIndex = 0; colIndex < this.Map[rowIndex].length; colIndex++) {
                const cell = this.Map[rowIndex][colIndex];
                const coordinate = { x: rowIndex, y: colIndex };

                if (cell && cell.value) {
                    if (cell.value === 'door') {
                        this.mapService.map.doorTiles.push({
                            coordinate,
                            isOpened: cell.doorState === 'open',
                        });
                    } else if (['water', 'ice', 'wall'].includes(cell.value)) {
                        this.mapService.map.tiles.push({
                            coordinate,
                            category: cell.value as TileCategory,
                        });
                    }

                    if (cell.item && cell.item !== '' && cell.item !== 'starting-point') {
                        this.mapService.map.items.push({
                            coordinate,
                            category: cell.item as ItemCategory,
                        });
                    }

                    if (cell.item === 'starting-point') {
                        this.mapService.map.startTiles.push({
                            coordinate,
                        });
                    }
                }
            }
        }
    }

    getTileImage(tileValue: string, rowIndex: number, colIndex: number): string {
        return this.imageService.getTileImage(tileValue, rowIndex, colIndex, this.Map);
    }

    getItemImage(item: string): string {
        return this.imageService.getItemImage(item);
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
        await this.screenshotService.captureAndUpload('screenshot-container').then((result: string) => {
            this.mapService.map.imagePreview = result;
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
