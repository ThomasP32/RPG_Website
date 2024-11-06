import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ImageService } from '@app/services/image/image.service';
import { MapCounterService } from '@app/services/map-counter/map-counter.service';
import { MapService } from '@app/services/map/map.service';
import { Mode } from '@common/map.types';

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [NgClass, CommonModule],
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit {
    selectedTile: string;

    @Output() tileSelected = new EventEmitter<string>();

    @Output() itemSelected = new EventEmitter<string>();

    isTilesVisible: boolean = true;
    isItemsVisible: boolean = true;
    isFlagVisible: boolean = true;
    isStartingPointVisible: boolean = true;

    itemsUsable: boolean = false;

    constructor(
        public mapService: MapService,
        public mapCounterService: MapCounterService,
        public imageService: ImageService,
    ) {
        this.mapService = mapService;
        this.mapCounterService = mapCounterService;
        this.imageService = imageService;
    }

    mode: Mode;
    async ngOnInit() {
        this.setMode();
        this.mapService.updateSelectedTile$.subscribe((tile) => {
            this.selectedTile = tile;
        });

        this.mapCounterService.startingPointCounter$.subscribe((counter) => {
            this.mapCounterService.startingPointCounter = counter;
        });
    }

    toggleTiles() {
        this.isTilesVisible = !this.isTilesVisible;
    }

    toggleItems() {
        this.isItemsVisible = !this.isItemsVisible;
    }

    toggleFlag() {
        this.isFlagVisible = !this.isFlagVisible;
    }
    toggleStartingPoint() {
        this.isStartingPointVisible = !this.isStartingPointVisible;
    }

    selectTile(tile: string) {
        if (this.selectedTile === tile) {
            this.mapService.updateSelectedTile('empty');
        } else {
            this.selectedTile = tile;
            this.mapService.updateSelectedTile(tile);
        }
    }

    startDrag(event: DragEvent, itemType: string) {
        if (itemType === 'starting-point') {
            this.selectedTile = '';
            this.mapService.updateSelectedTile(this.selectedTile);
            if (this.mapCounterService.startingPointCounter > 0) {
                event.dataTransfer?.setData('isStartingPoint', 'true');
            }
        } else {
            return;
        }
    }

    placeStartingPoint() {
        if (this.mapCounterService.startingPointCounter > 0) {
            this.mapCounterService.updateStartingPointCounter(this.mapCounterService.startingPointCounter - 1);
        }
    }

    selectItem(item: string) {
        this.selectedTile = 'empty';
        this.mapService.updateSelectedTile(this.selectedTile);

        if (this.mapCounterService.startingPointCounter === 0) {
            this.isStartingPointVisible = false;
        }
        this.itemSelected.emit(item);
    }

    getTileImage(tile: string): string {
        return this.imageService.loadTileImage(tile);
    }

    getItemImage(item: string): string {
        return this.imageService.getItemImageByString(item);
    }

    getStartingPointImage(): string {
        return this.imageService.getStartingPointImage();
    }

    setMode() {
        if (this.mapService.map.mode === Mode.Classic) {
            this.mode = Mode.Classic;
        } else {
            this.mode = Mode.Ctf;
        }
    }
}
