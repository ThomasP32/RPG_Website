import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
    mapTitle: string = '';
    mapDescription: string = '';

    isEditingTitle: boolean = false;
    isEditingDescription: boolean = false;

    mode: string;
    gameMode: string = '';
    numberOfPlayers: number = 0;

    map: Map;
    errorMessage: string;

    showErrorMessage: { entryError: boolean; nameError: boolean } = {
        entryError: false,
        nameError: false,
    };

    constructor(
        private route: ActivatedRoute,
        private mapService: MapService,
        private mapGetService: MapGetService,
    ) {}

    ngOnInit(): void {
        this.mapTitle = '';
        this.mapDescription = '';
        if (this.route.snapshot.params['mode']) {
            this.getUrlParams();
            this.urlConverter(this.mode);
        } else {
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
        this.mapTitle = '';
        this.mapDescription = '';

        if (this.route.snapshot.params['mode']) {
            this.mapService.resetMap();
        }
    }

    getUrlParams() {
        // this.route.queryParams.subscribe((params) => {
        //     this.mode = this.route.snapshot.params['mode'];
        // });
        this.mode = this.route.snapshot.params['mode'];
    }

    urlConverter(mode: string) {
        if (mode) {
            // this.gameMode = mode.split('=')[1];
            this.gameMode = mode;
        }
    }

    saveMap(): void {
        console.log('map saving');
        if (this.route.snapshot.params['mode']) {
            this.mapService.setMapTitle(this.mapTitle);
            this.mapService.setMapDescription(this.mapDescription);
            this.mapService.generateMapData();
        } else {
            this.mapService.saveEditedMap(this.map);
        }
        console.log("message d'erreur :", this.errorMessage);
    }

    showError(message: string) {
        this.errorMessage = message;
    }
}
