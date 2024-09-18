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
    @Input() selectedTile: string = 'grass';
    Map: { value: string | null; isHovered: boolean }[][] = [];
    isPlacing: boolean = false;
    defaultTile = 'grass';
    mapSize: string;
    mode: string;
    convertedMapSize: number;
    convertedCellSize : number;
    convertedMode: string;

    constructor(
        private route: ActivatedRoute,
        private renderer: Renderer2, 
        private cdRef: ChangeDetectorRef
    ) {}


    ngOnInit() {
        this.getUrlParams();
        this.urlConverter(this.mapSize, this.mode);
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
      console.log("cellsize =",this.convertedCellSize);
      this.cdRef.detectChanges(); 
    }

    selectTile(tile: string) {
        this.selectedTile = tile;
        console.log('Selected tile:', tile);
    }

    startPlacingTile(rowIndex: number, colIndex: number) {
        this.isPlacing = true;
        console.log('Start placing tile at:', { rowIndex, colIndex });
        this.placeTile(rowIndex, colIndex);
      }
    
      stopPlacingTile() {
        this.isPlacing = false;
        console.log('Stopped placing tile');
      }
    
      @HostListener('document:mouseup', ['$event'])
      onMouseUp(event: MouseEvent) {
        this.stopPlacingTile();
        console.log('Mouse up event detected, stopping placing');
      }
    
      placeTileOnMove(rowIndex: number, colIndex: number) {
        if (this.isPlacing) {
          console.log('Mouse move detected, placing tile at:', { rowIndex, colIndex });
          this.placeTile(rowIndex, colIndex);
        }
      }
    
      placeTile(rowIndex: number, colIndex: number) {
        if (this.selectedTile && this.Map[rowIndex][colIndex].value !== this.selectedTile) {
          this.Map[rowIndex][colIndex].value = this.selectedTile;
          console.log(`Placed tile "${this.selectedTile}" at position [${rowIndex}, ${colIndex}]`);
        }
      }
    

    getTileImage(tileValue: string): string {
        switch (tileValue) {
            case 'grass':
                return '../../../../assets/tiles/spfloor.jpg';
            case 'wall':
                return '../../../../assets/tiles/spwall.jpg';
            case 'ice':
                return '../../../../assets/tiles/spice.jpg';
            case 'water':
                return '../../../../assets/tiles/spacid.jpg';
            default:
                return '../../../../assets/tiles/spfloor.jpg';
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
        this.convertedCellSize = (600 / Number(mapSize.split('=')[1]));
    }
}
