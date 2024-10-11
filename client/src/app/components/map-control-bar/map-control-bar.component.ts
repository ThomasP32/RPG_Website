import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MapService } from '@app/services/map.service';

/* eslint-disable no-unused-vars */
const timeLimit = 2000;
@Component({
    selector: 'app-map-control-bar',
    standalone: true,
    templateUrl: './map-control-bar.component.html',
    styleUrls: ['./map-control-bar.component.scss'],
    imports: [CommonModule, FormsModule],
})
export class MapControlBarComponent implements OnInit {
    id: string;
    message: string;

    constructor(
        private route: ActivatedRoute,
        public mapService: MapService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        if (this.route.snapshot.params['mode']) {
            this.title = '';
            this.description = '';
        } else {
            this.getUrlId();
            this.editMode = false;
            this.title = this.mapService.map.name;
            this.description = this.mapService.map.description;
        }
    }
    title: string = '';
    description: string = '';
    editMode: boolean = true;

    toggleEditing() {
        this.editMode = !this.editMode;
    }

    resetMap(): void {
        this.mapService.resetMap();
    }

    getUrlId() {
        this.id = this.route.snapshot.params['id'];
    }

    saveMap(): void {
        const trimmedTitle = this.title.trim();
        const trimmedDescription = this.description.trim();

        if (!trimmedTitle || !trimmedDescription) {
            this.message = "Le titre et la description ne peuvent pas être vides ou composés uniquement d'espaces.";
            return;
        }

        this.mapService.map.name = this.title;
        this.mapService.map.description = this.description;
        this.mapService.generateMap();
    }

    back() {
        this.router.navigate(['/admin-page']);
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
