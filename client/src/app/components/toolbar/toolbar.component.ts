import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ImageService } from '@app/services/image/image.service';
import { MapCounterService } from '@app/services/map-counter/map-counter.service';
import { MapService } from '@app/services/map/map.service';
import { TileService } from '@app/services/tile/tile.service';
import { GameDescriptions, ItemCategory, Mode } from '@common/map.types';

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [NgClass, CommonModule],
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit {
    protected ItemCategory = ItemCategory;
    protected GameDescriptions = GameDescriptions;
    selectedTile: string;

    @Output() tileSelected = new EventEmitter<string>();

    @Output() itemSelected = new EventEmitter<string>();

    isTilesVisible: boolean = true;
    isItemsVisible: boolean = true;
    isFlagVisible: boolean = true;
    isStartingPointVisible: boolean = true;

    itemsUsable: boolean = false;

    constructor(
        protected readonly mapService: MapService,
        protected readonly mapCounterService: MapCounterService,
        protected readonly imageService: ImageService,
        protected readonly tileService: TileService,
    ) {
        this.mapService = mapService;
        this.mapCounterService = mapCounterService;
        this.imageService = imageService;
        this.tileService = tileService;
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

    startDrag(event: DragEvent, draggingObject: ItemCategory) {
        this.mapService.updateSelectedTile('');
        if (draggingObject === ItemCategory.StartingPoint) {
            if (this.mapCounterService.startingPointCounter > 0) {
                event.dataTransfer?.setData('draggingObject', JSON.stringify(draggingObject));
            }
        } else if (draggingObject === ItemCategory.Random) {
            if (this.mapCounterService.randomItemCounter > 0) {
                event.dataTransfer?.setData('draggingObject', JSON.stringify(draggingObject));
            }
        } else {
            event.dataTransfer?.setData('draggingObject', JSON.stringify(draggingObject));
        }
    }

    allowDrop(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent) {
        const data = event.dataTransfer?.getData('draggingObject');
        if (data) {
            const draggingObject: ItemCategory = JSON.parse(data) as ItemCategory;
            if (draggingObject === ItemCategory.StartingPoint) {
                this.mapService.removeStartingPoint(true);
                this.selectedTile = '';
            }
        }
        event.preventDefault();
    }

    placeStartingPoint() {
        if (this.mapCounterService.startingPointCounter > 0) {
            this.mapCounterService.startingPointCounter--;
        }
    }

    selectItem(item: string) {
        this.selectedTile = '';
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
        this.mode = this.mapService.map.mode === Mode.Classic ? Mode.Classic : Mode.Ctf;
    }
}
