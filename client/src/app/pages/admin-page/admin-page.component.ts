import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MapComponent } from '@app/components/map/map.component';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { DBMap as Map } from '@common/map.types';

@Component({
    selector: 'app-admin-page',
    standalone: true,
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [RouterLink, MapComponent],
})
export class AdminPageComponent implements OnInit {
    readonly title: string = 'Administration des jeux';
    maps: Map[] = [];
    currentMapId: string | null = null;
    showDeleteModal = false;

    @Input() mapId: string = '';

    constructor(
        private router: Router,
        private communicationMapService: CommunicationMapService,
    ) {
    }

    @ViewChild(MapComponent, { static: false }) mapComponent!: MapComponent;

    isMapVisible = false;

    toggleGameCreationModalVisibility(): void {
        this.isMapVisible = true;
    }

    onCloseModal(): void {
        this.isMapVisible = false;
    }

    ngOnInit(): void {
        this.communicationMapService.basicGet('admin').subscribe((maps) => {
            this.maps = maps as Map[];
        });
    }

    navigateToMain(): void {
        this.router.navigate(['/main-menu']);
    }

    editMap(map: Map): void {
        if (map._id) {
            window.location.href = `/edition/${map._id}`;
        }
    }

    // deleteMap(mapId: string): void {
    //     this.communicationMapService.basicDelete(`admin/${mapId}`).subscribe(() => this.updateDisplay());
    // }

    deleteMap(mapId: string): void {
        this.communicationMapService.basicDelete(`admin/${mapId}`).subscribe(
          (response) => {
            console.log(`Game with ID ${mapId} deleted.`);
            this.maps = this.maps.filter(map => map._id !== mapId);
          },
          (error) => {
            console.error('Error deleting the game:', error);
          }
        );
      }

    openConfirmationModal(map: any): void {
        this.currentMapId = map._id;
        this.showDeleteModal = true;
    }

    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.currentMapId = null;
    }

    confirmDelete(mapId: string): void {
        this.deleteMap(mapId);
        this.closeDeleteModal();
    }

    showDescription(map: any): void {
        map.showDescription = true;
    }

    hideDescription(map: any): void {
        map.showDescription = false;
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
        const month = String(date.getMonth() + 1).padStart(2, '0'); 
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
}
