import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommunicationService } from '@app/services/communication.map.service';
import { Map } from '@common/map.types';
import { ScreenshotComponent } from "../../components/screenshot/screenshot.component";

@Component({
    selector: 'app-admin-page',
    standalone: true,
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [RouterLink, ScreenshotComponent],
})
export class AdminPageComponent implements OnInit {
    readonly title: string = 'Maps Administration';
    maps: Map[] = [];
    
    @ViewChild(ScreenshotComponent) screenshotComponent!: ScreenshotComponent;

    constructor(
        private router: Router,
        private communicationService: CommunicationService,
    ) {}

    screenShot(): void {
        // Vérification que screenshotComponent est bien initialisé avant d'appeler captureAndUpload
        if (this.screenshotComponent) {
            this.screenshotComponent.captureAndUpload();
        } else {
            console.error('ScreenshotComponent is not available');
        }
    }

    ngOnInit(): void {
        this.communicationService.basicGet<Map[]>('admin').subscribe((maps) => (this.maps = maps));
    }

    navigateToMain(): void {
        this.router.navigate(['/home']);
    }

    editGame(mapId: string): void {
        this.router.navigate(['/admin/edit-map', mapId]);
    }

    deleteGame(mapId: string): void {
        if (confirm('Are you sure you want to delete this game ?')) {
            this.communicationService.basicDelete(`admin/${mapId}`).subscribe(()=>this.updateDisplay());
        }
    }

    updateDisplay(): void {
        this.communicationService.basicGet<Map[]>('admin').subscribe((maps) => (this.maps = maps));
    }

    togglesVisibility(mapId: string): void {
        this.communicationService.basicPatch(`admin/${mapId}`).subscribe(() => this.updateDisplay());
    }

    formatDate(lastModified: Date): string {
        const date = new Date(lastModified);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mois de 0 à 11
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
}