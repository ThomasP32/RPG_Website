import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

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

    constructor(private route: ActivatedRoute) {}

    ngOnInit() {
        this.getUrlParams();
        this.urlConverter(this.mode);
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
        this.selectedTile = tile;
        this.tileSelected.emit(tile);
        console.log('Selected tile:', this.selectedTile);
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
