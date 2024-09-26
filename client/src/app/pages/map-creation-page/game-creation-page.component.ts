import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapAreaComponent } from '@app/components/map-area/map-area.component';
import { MapControlBarComponent } from '@app/components/map-control-bar/map-control-bar.component';
import { ToolbarComponent } from '@app/components/toolbar/toolbar.component';
import { MapService } from '@app/services/map.service';
import { Map } from '@common/map.types';

@Component({
    selector: 'app-game-creation-page',
    standalone: true,
    imports: [MapControlBarComponent, ToolbarComponent, MapAreaComponent],
    templateUrl: './game-creation-page.component.html',
    styleUrl: './game-creation-page.component.scss',
})
export class GameCreationPageComponent implements OnInit {
    @ViewChild(MapAreaComponent, { static: false }) mapAreaComponent!: MapAreaComponent;
    @ViewChild(MapControlBarComponent, { static: false }) mapControlBarComponent!: MapControlBarComponent;
    @ViewChild(ToolbarComponent, { static: false }) appToolbarComponent!: ToolbarComponent;

    map! : Map;

    selectedTile: string = 'grass';

    constructor(private mapService: MapService, private route : ActivatedRoute) {}

    ngOnInit(): void {
        this.mapService.resetMap$.subscribe(() => {
            if (this.mapAreaComponent) {
                this.mapAreaComponent.resetMapToDefault();
            }
        });
        this.mapService.generateMap$.subscribe(() => {
            if (this.mapAreaComponent) {
                this.mapAreaComponent.resetMapToDefault();
            }
        });
        this.route.data.subscribe(data => {
            this.map = data['map'];
            this.initializeMapComponents(this.map); 
          });
    }

    onTileSelected(tile: string) {
        this.selectedTile = tile;
    }

    //TODO: GET MAP
    initializeMapComponents(map: Map) {
        this.appToolbarComponent.initializeMap(map);
        this.mapAreaComponent.initializeMap(map); 
        this.mapControlBarComponent.initializeMap(map);
      }

      //TODO : FIRST GET MAP PUT DANS NGONINIT()
    //   this.route.data.subscribe(data => {
    //     this.map = data['map'];
    //     this.initializeMapComponents(this.map); 
    //   });
}
