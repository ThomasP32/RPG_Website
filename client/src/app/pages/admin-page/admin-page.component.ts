import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MapComponent } from '@app/components/map/map.component';
import { firstValueFrom } from 'rxjs';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { DBMap as Map } from '@common/map.types';

@Component({
    selector: 'app-admin-page',
    standalone: true,
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [RouterLink],
})
export class AdminPageComponent implements OnInit {
    readonly title: string = 'Administration des jeux';
    maps: Map[] = [];
    deleteTriggered = false;

    @Input() mapId: string = '';

    constructor(
        private router: Router,
        private communicationMapService: CommunicationMapService,
    ) {
        // this.communicationMapService.maps$.subscribe((map) => {
        //     this.maps = maps;
        // });
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
        this.communicationMapService.basicGet('admin').subscribe((maps => {
            this.maps = maps as Map[];
        }));
    }

    navigateToMain(): void {
        this.router.navigate(['/main-menu']);
    }

    editGame(map: Map): void {
        if (map._id) {
            window.location.href = `/edition/${map._id}`;
        }
    }

   
    async deleteGame(id: string): Promise<void> {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette carte?')) {
          try {
            await firstValueFrom(this.communicationMapService.basicDelete(`admin/${id}`));
            console.log('Game deleted successfully');
            this.updateDisplay();
          } catch (error) {
            console.error('Error deleting game:', error);
          }
      }
    }

    // deleteGame(mapId: string): void {
    //     if (confirm('Are you sure you want to delete this game ?')) {
    //         this.communicationMapService.basicDelete(`admin/${mapId}`).subscribe(() => this.updateDisplay()); 
    //     }
    // }

    deleteTrigger(): void {
        this.deleteTriggered = !this.deleteTriggered;
        console.log(this.deleteTriggered);
    }
    
    showDescription(): void {

    }

    hideDescription(): void {
        // game.showDescription = false
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
