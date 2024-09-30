import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MapComponent } from '@app/components/map/map.component';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { DBMap as Map } from '@common/map.types';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-admin-page',
    standalone: true,
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [RouterLink, MapComponent],
})
export class AdminPageComponent implements OnInit {
    readonly title: string = 'Maps Administration';
    maps: Map[] = [];
    deleteTriggered: { [mapId: string]: boolean } = {};
    isMapVisible = false;

    @ViewChild(MapComponent, { static: false }) mapComponent!: MapComponent;

    @Input() mapId: string = '';

    constructor(
        private router: Router,
        private communicationMapService: CommunicationMapService,
    ) {}

    ngOnInit(): void {
        this.updateDisplay();
    }

    toggleGameCreationModalVisibility(): void {
        this.isMapVisible = true;
    }

    onCloseModal(): void {
        this.isMapVisible = false;
    }
    navigateToMain(): void {
        this.router.navigate(['/mainmenu']);
    }

    editGame(map: Map): void {
        if (map._id) {
            window.location.href = `/edition/${map._id}`;
        }
    }

    async deleteGame(id: string): Promise<void> {
        try {
            await firstValueFrom(this.communicationMapService.basicDelete(`admin/${id}`));
            console.log('Game deleted successfully');
            this.updateDisplay();
        } catch (error) {
            console.error('Error deleting game:', error);
        }
    }

    updateDisplay(): void {
        this.communicationMapService.basicGet<Map[]>('admin').subscribe((maps) => (this.maps = maps));
    }

    toggleVisibility(mapId: string): void {
        this.communicationMapService.basicPatch(`admin/${mapId}`).subscribe(() => this.updateDisplay());
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
