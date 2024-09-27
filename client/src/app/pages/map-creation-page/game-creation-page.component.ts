import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapAreaComponent } from '@app/components/map-area/map-area.component';
import { MapControlBarComponent } from '@app/components/map-control-bar/map-control-bar.component';
import { ToolbarComponent } from '@app/components/toolbar/toolbar.component';
import { CommunicationMapService } from '@app/services/communication.map.service';
import { MapService } from '@app/services/map.service';
import { Map } from '@common/map.types';
import { firstValueFrom } from 'rxjs';

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

    map!: Map;
    
    mapId: string = '';
    newMap: Map ;


    selectedTile: string = 'grass';

    constructor(private mapService: MapService, private route : ActivatedRoute, private communicationMapService : CommunicationMapService) {}

    async ngOnInit(): Promise<void> {
        if(this.route.snapshot.params['id']){
            this.getUrlParams();
            await this.getMap(this.mapId);
            console.log('get map : ', this.newMap);
        }
       
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
    }

    onTileSelected(tile: string) {
        this.selectedTile = tile;
    }

    getUrlParams(): void {
        this.route.queryParams.subscribe(() => {
            this.mapId = this.route.snapshot.params['id'];
        });
    }

    async getMap(id: string): Promise<void> {
        this.newMap = await firstValueFrom(this.communicationMapService.basicGet<Map>(`admin/${id}`));
    }

    //TODO: GET MAP
    initializeMapComponents(map: Map) {
        this.appToolbarComponent.initializeMap(map);
        this.mapAreaComponent.initializeMap(map); 
        this.mapControlBarComponent.initializeMap(map);
      }

}
