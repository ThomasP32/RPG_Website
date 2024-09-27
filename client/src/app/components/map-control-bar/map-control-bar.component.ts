import { CommonModule, NgIf } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MapGetService } from '@app/services/map-get.service';
import { MapService } from '@app/services/map.service';
import { Map } from '@common/map.types';

@Component({
    selector: 'app-map-control-bar',
    standalone: true,
    templateUrl: './map-control-bar.component.html',
    styleUrls: ['./map-control-bar.component.scss'],
    imports: [CommonModule, NgIf, FormsModule],
})
export class MapControlBarComponent implements OnInit {
    mapTitle: string = ''; // Titre par défaut
    mapDescription: string = ''; // Description par défaut

    isEditingTitle: boolean = false;
    isEditingDescription: boolean = false;

    mode: string;
    gameMode: string = '';
    numberOfPlayers: number = 0;

    @Input() map!: Map;

    constructor(
        private route: ActivatedRoute,
        private mapService: MapService,
        private mapGetService: MapGetService
    ) {}

    ngOnInit(): void {
        if(this.route.snapshot.params['mode']){
            this.getUrlParams();
            this.urlConverter(this.mode);
        }else {
            this.map = this.mapGetService.map;
            this.mapTitle = this.map.name;
            this.mapDescription = this.map.description;
        }
    }
    toggleEditTitle(): void {
        this.isEditingTitle = !this.isEditingTitle;
    }

    toggleEditDescription(): void {
        this.isEditingDescription = !this.isEditingDescription;
    }

    resetMap(): void {
        console.log('resetting the map');
        console.log('MapControlBar: Triggering reset via service');
        this.mapService.resetMap();
    }

    createMap(): void {
        const mapData = this.mapService.generateMapData();

        this.mapService.saveMap(mapData);
        console.log('map saving');

    }

    getUrlParams() {
        this.route.queryParams.subscribe((params) => {
            this.mode = this.route.snapshot.params['mode'];
        });
    }

    urlConverter(mode: string) {
        if (mode) {
            this.gameMode = mode.split('=')[1];
        }
    }

}
