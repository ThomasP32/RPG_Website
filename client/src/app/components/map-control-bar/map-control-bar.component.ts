import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MapService } from '@app/services/map.service';

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

    showErrorMessage: { entryError: boolean; nameError: boolean } = {
        entryError: false,
        nameError: false,
    };

    constructor(
        private route: ActivatedRoute,
        private mapService: MapService,
    ) {}

    ngOnInit(): void {
        this.getUrlParams();
        this.urlConverter(this.mode);
        this.mapTitle = '';
        this.mapDescription = '';
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

    getUrlParams() {
        this.route.queryParams.subscribe((params) => {
            this.mode = this.route.snapshot.params['mode'];
        });
    }

    urlConverter(mode: string) {
        console.log('URL params:', mode);
        this.gameMode = mode.split('=')[1];
    }

    saveMap(): void {
        if (this.mapTitle !== '') {
            console.log('saving the map', this.mapTitle);
            this.mapService.setMapTitle(this.mapTitle);
            this.mapService.setMapDescription(this.mapDescription);
            this.mapService.generateMapData();
        } else {
            this.showErrorMessage.entryError = true;
            return;
        }
    }
}
