import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapAreaComponent } from '@app/components/map-area/map-area.component';
import { MapControlBarComponent } from '@app/components/map-control-bar/map-control-bar.component';
import { ToolbarComponent } from '@app/components/toolbar/toolbar.component';
import { MapGetService } from '@app/services/map-get.service';
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
    isCreationPage = false;

    map!: Map;
    mapId: string = '';
    selectedTile: string;
    constructor(
        private mapService: MapService,
        private route: ActivatedRoute,
        private mapGetService: MapGetService,
    ) {}

    async ngOnInit(): Promise<void> {
        if (this.route.snapshot.params['id']) {
            this.getUrlParams();
            await this.mapGetService.getMap(this.mapId);
            this.map = this.mapGetService.map;
            this.isCreationPage = false;
        } else {
            this.isCreationPage = true;
        }

        this.mapService.resetMap$.subscribe(() => {
            if (this.mapAreaComponent) {
                this.mapAreaComponent.resetMapToDefault();
            }
        });
        this.mapService.generateMap$.subscribe(() => {
            if (this.mapAreaComponent) {
                const mapData = this.mapAreaComponent.generateMapData();
                this.mapService.saveMap(mapData);
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
}
