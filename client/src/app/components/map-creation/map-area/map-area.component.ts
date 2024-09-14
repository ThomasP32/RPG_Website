import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-map-area',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './map-area.component.html',
    styleUrl: './map-area.component.scss',
})
export class MapAreaComponent {
    @Input() selectedTile: string = 'grass';
    Map: { value: string | null; isHovered: boolean }[][] = [];
    isPlacing: boolean = false;
    defaultTile = 'grass';
    mapSize: string;
    mode: string;
    convertedMapSize: number;
    convertedMode: string;

    constructor(private route: ActivatedRoute) {}

    ngOnInit() {
        this.getUrlParams();
        this.urlConverter(this.mapSize, this.mode);
        this.createMap(this.convertedMapSize, this.mode);
    }

    createMap(mapSize: number, mode: string) {
        this.Map = [];

        for (let i = 0; i < mapSize; i++) {
            const row: { value: string | null; isHovered: boolean }[] = [];
            for (let j = 0; j < mapSize; j++) {
                row.push({ value: 'grass', isHovered: false });
            }
            this.Map.push(row);
        }
    }

    selectTile(tile: string) {
        this.selectedTile = tile;
        console.log('Selected tile:', tile);
    }

    startPlacingTile(rowIndex: number, colIndex: number) {
        this.isPlacing = true;
        this.placeTile(rowIndex, colIndex);
    }

    stopPlacingTile() {
        this.isPlacing = false;
    }

    placeTileOnMove(rowIndex: number, colIndex: number) {
        if (this.isPlacing) {
            this.placeTile(rowIndex, colIndex);
        }
    }

    placeTile(rowIndex: number, colIndex: number) {
        if (this.selectedTile && this.Map[rowIndex][colIndex].value !== this.selectedTile) {
            this.Map[rowIndex][colIndex].value = this.selectedTile;
        }
    }

    getTileImage(tileValue: string): string {
        switch (tileValue) {
            case 'grass':
                return '../../../../assets/tiles/wood.png';
            case 'wall':
                return '../../../../assets/tiles/wall.png';
            case 'ice':
                return '../../../../assets/tiles/iceacid.png';
            case 'water':
                return '../../../../assets/tiles/acid.png';
            default:
                return '../../../../assets/tiles/wood.png';
        }
    }

    getUrlParams() {
        this.route.queryParams.subscribe((params) => {
            this.mapSize = this.route.snapshot.params['size'];
            this.mode = this.route.snapshot.params['mode'];
            console.log('Retrieved URL params:', { mapSize: this.mapSize, mode: this.mode });
        });
    }

    urlConverter(mapSize: string, mode: string) {
        this.convertedMapSize = Number(mapSize.split('=')[1]);
        this.convertedMode = mode.split('=')[1];
    }
}
