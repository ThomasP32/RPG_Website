import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ImageService } from '@app/services/image.service';
import { MapCounterService } from '@app/services/map-counter.service';
import { MapGetService } from '@app/services/map-get.service';
import { MapService } from '@app/services/map.service';
import { Map } from '@common/map.types';
/* eslint-disable no-unused-vars */
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

    mode: string;
    convertedMode: string;
    mapId: string;

    map!: Map;

    isTilesVisible: boolean = true;
    isItemsVisible: boolean = true;
    isFlagVisible: boolean = true;
    isStartingPointVisible: boolean = true;

    itemsUsable: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private mapService: MapService,
        private mapGetService: MapGetService,
        public mapCounterService: MapCounterService,
        public imageService: ImageService,
    ) {}

    async ngOnInit() {
        if (this.route.snapshot.params['mode']) {
            this.getUrlParams();
            this.urlConverterMode();
        } else {
            this.map = this.mapGetService.map;
            this.mode = this.map.mode;
        }
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
            this.selectedTile = 'empty';
            this.mapService.updateSelectedTile(this.selectedTile);
            if (this.mapCounterService.startingPointCounter > 0) {
                event.dataTransfer?.setData('item', itemType);
            } else if (itemType) {
                event.dataTransfer?.setData('item', itemType);
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
        return this.imageService.getItemImage(item);
    }

    getUrlParams(): void {
        this.route.queryParams.subscribe(() => {
            this.mode = this.route.snapshot.params['mode'];
        });
    }

    urlConverterMode(): void {
        this.convertedMode = this.mode.split('=')[1];
        this.mode = this.convertedMode;
    }
}
