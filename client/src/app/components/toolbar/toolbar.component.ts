import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapService } from '@app/services/map.service';

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [NgClass, CommonModule],
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent {
    @Input() selectedTile: string;

    @Output() tileSelected = new EventEmitter<string>();

    @Output() itemSelected = new EventEmitter<string>();

    mode: string;
    convertedMode: string;

    isTilesVisible: boolean = true;
    isItemsVisible: boolean = true;
    isFlagVisible: boolean = true;
    isStartingPointVisible: boolean = true;

    startingPointCounter: number;
    flagCounter: number = 0;
    randomItemCounter: number;
    itemsCounter: number;

    itemsUsable: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private mapService: MapService,
    ) {}

    ngOnInit() {
        this.getUrlParams();
        this.urlConverter(this.mode);
        this.mapService.startingPointCounter$.subscribe((counter) => {
            this.startingPointCounter = counter;
        });
        this.mapService.randomItemCounter$.subscribe((counter) => {
            this.randomItemCounter = counter;
        });
        this.mapService.itemsCounter$.subscribe((counter) => {
            this.itemsCounter = counter;
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
            // If the tile is already selected, deselect it
            this.selectedTile = 'empty';
            this.tileSelected.emit(this.selectedTile);
            console.log('Tile deselected, selectedTile is now empty');
        } else if (tile === 'starting-point' && this.startingPointCounter > 0) {
            // this.selectedTile = tile;
            // this.tileSelected.emit(tile);
            console.log('Starting point selected, counter:', this.startingPointCounter);
        } else {
            this.selectedTile = tile;
            this.tileSelected.emit(tile);
            console.log('Selected tile:', this.selectedTile);
        }

        if (this.startingPointCounter === 0) {
            this.isStartingPointVisible = false;
            console.log('No more starting points available');
        }
    }

    startDrag(event: DragEvent, itemType: string) {
        if (itemType === 'starting-point' && this.startingPointCounter > 0) {
            event.dataTransfer?.setData('item', itemType);
            console.log('Dragging:', itemType);
        } else if (itemType === 'random' && this.randomItemCounter > 0) {
            event.dataTransfer?.setData('item', itemType);
            console.log('Dragging:', itemType);
        } else if (itemType) {
            event.dataTransfer?.setData('item', itemType);
            console.log('Dragging:', itemType);
        }
    }

    placeStartingPoint() {
        if (this.startingPointCounter > 0) {
            this.mapService.updateStartingPointCounter(this.startingPointCounter - 1);
        }
    }

    selectItem(item: string) {
        this.itemSelected.emit(item);
    }

    getUrlParams() {
        this.route.queryParams.subscribe((params) => {
            this.mode = this.route.snapshot.params['mode'];
        });
    }
    urlConverter(mode: string) {
        console.log('URL params:', mode);
        this.convertedMode = mode.split('=')[1];
        this.mode = this.convertedMode;
        console.log('Converted mode:', this.convertedMode);
    }
}
