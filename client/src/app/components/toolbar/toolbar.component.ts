import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapService } from '@app/services/map.service';
import { Map } from '@common/map.types';

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [NgClass, CommonModule],
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit {
    @Input() selectedTile: string;

    @Input() map! : Map;

    @Output() tileSelected = new EventEmitter<string>();

    @Output() itemSelected = new EventEmitter<string>();

    mode: string;
    convertedMode: string;
    mapId: string;
    name: string; //TODO: a enlever

    isTilesVisible: boolean = true;
    isItemsVisible: boolean = true;
    isFlagVisible: boolean = true;
    isStartingPointVisible: boolean = true;

    startingPointCounter: number;
    flagCounter: number = 2;
    randomItemCounter: number = 6;

    constructor(
        private route: ActivatedRoute,
        private mapService: MapService,
    ) {}

    ngOnInit() {
        this.getUrlParams();
        this.urlConverterMode();
        this.mapService.startingPointCounter$.subscribe((counter) => {
            this.startingPointCounter = counter;
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
        } else if (tile === 'starting-point' && this.startingPointCounter > 0) {
            // this.selectedTile = tile;
            // this.tileSelected.emit(tile);
        } else {
            this.selectedTile = tile;
            this.tileSelected.emit(tile);
        }

        if (this.startingPointCounter === 0) {
            this.isStartingPointVisible = false;
        }
    }

    startDrag(event: DragEvent, itemType: string) {
        if (itemType === 'starting-point' && this.startingPointCounter > 0) {
            event.dataTransfer?.setData('item', itemType);
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

    getUrlParams(): void {
        this.route.queryParams.subscribe(() => {
            this.mode = this.route.snapshot.params['mode'];
        });
    }

    urlConverterMode(): void {
        this.convertedMode = this.mode.split('=')[1];
        this.mode = this.convertedMode;
    }

    //TODO: GET MAP
    initializeMap(map: Map) {
        this.name = map.name; //TODO: a enlever
        // this.convertedMode = map.mode;
      }
}
