import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MapGetService } from '@app/services/map-get.service';
import { MapService } from '@app/services/map.service';
import { Map } from '@common/map.types';

const timeLimit = 2000;
@Component({
    selector: 'app-map-control-bar',
    standalone: true,
    templateUrl: './map-control-bar.component.html',
    styleUrls: ['./map-control-bar.component.scss'],
    imports: [CommonModule, FormsModule],
})
export class MapControlBarComponent implements OnInit {
    mapTitle: string = '';
    mapDescription: string = '';

    isEditingTitle: boolean = false;
    isEditingDescription: boolean = false;

    mode: string;
    numberOfPlayers: number = 0;
    id: string;

    map: Map;
    message: string;

    // showErrorMessage: { entryError: boolean; nameError: boolean } = {
    //     entryError: false,
    //     nameError: false,
    // };

    constructor(
        private route: ActivatedRoute,
        private mapService: MapService,
        private mapGetService: MapGetService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.mapTitle = '';
        this.mapDescription = '';
        if (this.route.snapshot.params['mode']) {
            this.getUrlMode();
        } else {
            this.getUrlId();
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
        this.mapService.resetMap();
    }

    getUrlMode() {
        this.mode = this.route.snapshot.params['mode'];
    }

    getUrlId() {
        this.id = this.route.snapshot.params['id'];
    }

    saveMap(): void {
        if (this.route.snapshot.params['mode']) {
            this.mapService.setMapTitle(this.mapTitle);
            this.mapService.setMapDescription(this.mapDescription);
            this.mapService.generateMapData();
        } else if (this.route.snapshot.params['id']) {
            this.mapService.setMapTitle(this.mapTitle);
            this.mapService.setMapDescription(this.mapDescription);
            this.mapService.generateMapData();
        }
    }

    showError(message: string) {
        this.message = message;
        if (this.message === 'Votre jeu a été sauvegardé avec succès!') {
            setTimeout(() => {
                this.router.navigate(['/admin-page']);
            }, timeLimit);
        }
    }
}
