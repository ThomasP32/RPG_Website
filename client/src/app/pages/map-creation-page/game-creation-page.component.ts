import { Component, OnInit, ViewChild } from '@angular/core';
import { MapAreaComponent } from '@app/components/map-area/map-area.component';
import { MapControlBarComponent } from '@app/components/map-control-bar/map-control-bar.component';
import { ToolbarComponent } from '@app/components/toolbar/toolbar.component';
import { MapService } from '@app/services/map.service';

@Component({
    selector: 'app-game-creation-page',
    standalone: true,
    imports: [MapControlBarComponent, ToolbarComponent, MapAreaComponent],
    templateUrl: './game-creation-page.component.html',
    styleUrl: './game-creation-page.component.scss',
})
export class GameCreationPageComponent implements OnInit {
    selectedTile: string;

    @ViewChild(MapAreaComponent, { static: false }) mapAreaComponent!: MapAreaComponent;
    @ViewChild(MapControlBarComponent, { static: false }) MapControlBarComponent!: MapControlBarComponent;

    constructor(private mapService: MapService) {}

    ngOnInit(): void {
        this.mapService.resetMap$.subscribe(() => {
            if (this.mapAreaComponent) {
                console.log('Resetting map via service');
                this.mapAreaComponent.resetMapToDefault();
            }
        });
        this.mapService.generateMap$.subscribe(() => {
            if (this.mapAreaComponent) {
                const mapData = this.mapAreaComponent.generateMapData();
                this.mapService.saveMap(mapData);
                console.log('generating map via service', mapData);
            }
        });
    }

    onTileSelected(tile: string) {
        this.selectedTile = tile;
    }
}
