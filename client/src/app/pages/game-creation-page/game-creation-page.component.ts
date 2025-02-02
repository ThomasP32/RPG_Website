import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MapAreaComponent } from '@app/components/map-area/map-area.component';
import { MapControlBarComponent } from '@app/components/map-control-bar/map-control-bar.component';
import { ToolbarComponent } from '@app/components/toolbar/toolbar.component';
import { MapService } from '@app/services/map/map.service';
import { Map, Mode } from '@common/map.types';
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
    mapSize: number;
    mode: Mode;
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly mapService: MapService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
    ) {
        this.mapService = mapService;
        this.route = route;
        this.router = router;
    }

    async ngOnInit(): Promise<void> {
        if (this.router.url.includes('edition')) {
            this.getUrlParams();
            await this.mapService.getMap(this.mapId);
            this.map = this.mapService.map;
            this.isCreationPage = false;
        } else {
            this.getUrlQueryParams();
            this.mapService.createMap(this.mode, this.mapSize);
            this.isCreationPage = true;
        }

        this.mapService.resetMap$.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
            if (this.mapAreaComponent) {
                this.mapAreaComponent.resetMapToDefault();
                this.mapService.updateSelectedTile('empty');
            }
        });

        this.mapService.generateMap$.pipe(takeUntil(this.unsubscribe$)).subscribe(async () => {
            if (this.mapAreaComponent) {
                await this.mapAreaComponent.screenMap();
                this.mapAreaComponent.generateMap();
                if (this.route.snapshot.params['id']) {
                    const id = this.route.snapshot.params['id'];
                    const errorMessage = await this.mapService.updateMap(id);
                    this.mapControlBarComponent.showError(errorMessage);
                } else {
                    const errorMessage = await this.mapService.saveNewMap();
                    this.mapControlBarComponent.showError(errorMessage);
                }
            }
        });
    }

    getUrlParams(): void {
        if (this.route.snapshot.params['id']) {
            this.mapId = this.route.snapshot.params['id'];
        }
    }

    getUrlQueryParams(): void {
        const queryParams = this.route.snapshot.queryParams;

        if (queryParams['size']) {
            const mapSize = parseInt(queryParams['size']);
            if (mapSize === 10 || mapSize === 15 || mapSize === 20) {
                this.mapSize = mapSize;
            } else {
                this.router.navigate(['/']);
            }
        }
        if (queryParams['mode']) {
            const mode = queryParams['mode'];
            if (mode === 'classique') {
                this.mode = Mode.Classic;
            } else if (mode === 'ctf') {
                this.mode = Mode.Ctf;
            } else {
                this.router.navigate(['/']);
            }
        }
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
