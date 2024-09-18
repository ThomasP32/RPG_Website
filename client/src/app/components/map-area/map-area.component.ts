import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, Input, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapControlBarComponent } from '../map-control-bar/map-control-bar.component';

@Component({
    selector: 'app-map-area',
    standalone: true,
    imports: [MapControlBarComponent,CommonModule],
    templateUrl: './map-area.component.html',
    styleUrl: './map-area.component.scss',
})
export class MapAreaComponent {
    @Input() selectedTile: string = 'floor';
    Map: { value: string | null; isHovered: boolean }[][] = [];
    isPlacing: boolean = false;
    defaultTile = 'floor';
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
            case 'door':
                return '../../../../assets/tiles/door.png';
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
        this.convertedMapSize = Number(size.split('=')[1]);
        console.log('Converted map size:', this.convertedMapSize);
    }
}
