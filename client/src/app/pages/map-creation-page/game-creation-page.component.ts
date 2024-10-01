import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapAreaComponent } from '@app/components/map-area/map-area.component';
import { MapControlBarComponent } from '@app/components/map-control-bar/map-control-bar.component';
import { ToolbarComponent } from '@app/components/toolbar/toolbar.component';
import { MapGetService } from '@app/services/map-get.service';
import { MapService } from '@app/services/map.service';
import { Map } from '@common/map.types';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-game-creation-page',
    standalone: true,
    imports: [MapControlBarComponent, ToolbarComponent, MapAreaComponent],
    templateUrl: './game-creation-page.component.html',
    styleUrl: './game-creation-page.component.scss',
})
export class GameCreationPageComponent implements OnInit, OnDestroy {
    @ViewChild(MapAreaComponent, { static: false }) mapAreaComponent!: MapAreaComponent;
    @ViewChild(MapControlBarComponent, { static: false }) mapControlBarComponent!: MapControlBarComponent;
    @ViewChild(ToolbarComponent, { static: false }) appToolbarComponent!: ToolbarComponent;
    
    isCreationPage = false;
    map!: Map;
    mapId: string = '';
    private unsubscribe$ = new Subject<void>(); // Used to manage unsubscriptions

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

        this.mapService.resetMap$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                if (this.mapAreaComponent) {
                    this.mapAreaComponent.resetMapToDefault();
                    this.mapService.updateSelectedTile('empty');
                }
            });

        this.mapService.generateMap$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(async () => {
                if (this.mapAreaComponent) {
                    await this.mapAreaComponent.screenMap();
                    const mapData = this.mapAreaComponent.generateMapData();
                    if (this.route.snapshot.params['mode']) {
                        const errorMessage = await this.mapService.saveNewMap(mapData);
                        this.mapControlBarComponent.showError(errorMessage);
                    } else {
                        const id = this.route.snapshot.params['id'];
                        const errorMessage = await this.mapService.updateMap(mapData, id);
                        this.mapControlBarComponent.showError(errorMessage);
                    }
                }
            });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    getUrlParams(): void {
        this.mapId = this.route.snapshot.params['id'];
    }
}
