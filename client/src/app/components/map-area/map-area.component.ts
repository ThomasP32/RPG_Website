import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, Input, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-map-area',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './map-area.component.html',
    styleUrl: './map-area.component.scss',
})
export class MapAreaComponent {
    @Input() selectedTile: string = 'floor';
    Map: { value: string | null; isHovered: boolean; doorState?: 'open' | 'closed' }[][] = [];
    isPlacing: boolean = false;
    isErasing: boolean = false;
    defaultTile = 'floor';
    mapSize: string;
    mode: string;
    convertedMapSize: number;
    convertedCellSize: number;
    convertedMode: string;

    constructor(
        private route: ActivatedRoute,
        private renderer: Renderer2,
        private cdRef: ChangeDetectorRef,
    ) {}

    ngOnInit() {
        this.getUrlParams();
        this.urlConverter(this.mapSize);
        this.createMap(this.convertedMapSize, this.mode);
        this.setCellSize();
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

    setCellSize() {
        const root = document.querySelector(':root') as HTMLElement;
        this.renderer.setStyle(root, '--cell-size', `${this.convertedCellSize}px`);
        console.log('cellsize =', this.convertedCellSize);
        this.cdRef.detectChanges();
    }

    selectTile(tile: string) {
        this.selectedTile = tile;
        console.log('Selected tile:', tile);
    }

    startPlacingTile(rowIndex: number, colIndex: number, isRightClick: boolean = false) {
        if (isRightClick) {
            this.isErasing = true;
            this.placeTile(rowIndex, colIndex, true);
        } else {
            this.isPlacing = true;
            this.placeTile(rowIndex, colIndex, false);
        }
    }

    stopPlacingTile() {
        this.isPlacing = false;
        this.isErasing = false;
        console.log('Stopped placing tile');
    }

    @HostListener('document:mouseup', ['$event'])
    onMouseUp(event: MouseEvent) {
        this.stopPlacingTile();
        // console.log('Mouse up event detected, stopping placing');
    }

    placeTileOnMove(rowIndex: number, colIndex: number) {
        if (this.isPlacing) {
            this.placeTile(rowIndex, colIndex, false);
        } else if (this.isErasing) {
            this.placeTile(rowIndex, colIndex, true);
        }
    }

    placeTile(rowIndex: number, colIndex: number, isErasing: boolean) {
        if (this.selectedTile === 'door') {
            if (this.Map[rowIndex][colIndex].value === 'door') {
                const currentState = this.Map[rowIndex][colIndex].doorState;
                this.Map[rowIndex][colIndex].doorState = currentState === 'closed' ? 'open' : 'closed';
                console.log(`Toggled door state at position [${rowIndex}, ${colIndex}] to: ${this.Map[rowIndex][colIndex].doorState}`);
            } else {
                this.Map[rowIndex][colIndex].value = 'door';
                this.Map[rowIndex][colIndex].doorState = 'closed';
                console.log(`Placed door (closed) at position [${rowIndex}, ${colIndex}]`);
            }
        } else {
            const tileToPlace = isErasing ? this.defaultTile : this.selectedTile;
            if (tileToPlace && this.Map[rowIndex][colIndex].value !== tileToPlace) {
                this.Map[rowIndex][colIndex].value = tileToPlace;
                console.log(`Placed tile "${tileToPlace}" at position [${rowIndex}, ${colIndex}]`);
            }
        }
    }

    resetMapToDefault() {
        for (let i = 0; i < this.Map.length; i++) {
            for (let j = 0; j < this.Map[i].length; j++) {
                this.Map[i][j].value = this.defaultTile;
            }
        }
        console.log('Map has been reset to default');
    }

    getTileImage(tileValue: string, rowIndex: number, colIndex: number): string {
        switch (tileValue) {
            case 'door':
                const doorState = this.Map[rowIndex][colIndex].doorState;
                return doorState === 'open' ? '../../../../assets/tiles/door_x.png' : '../../../../assets/tiles/door_y.png';
            case 'wall':
                return '../../../../assets/tiles/wall.png';
            case 'ice':
                return '../../../../assets/tiles/ice.png';
            case 'water':
                return '../../../../assets/tiles/water.png';
            default:
                return '../../../../assets/tiles/floor.png';
        }
    }
    //TODO: PUT it in a service, same as in toolbar.component.ts
    getUrlParams() {
        this.route.queryParams.subscribe((params) => {
            this.mapSize = this.route.snapshot.params['size'];
        });
    }

    urlConverter(size: string) {
        console.log('URL params:', size);
        this.convertedMapSize = parseInt(size.split('=')[1]);
        console.log('Converted map size:', this.convertedMapSize);
    }
}
