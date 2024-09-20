import { NgClass, NgForOf, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModesComponent } from '../modes/modes.component';

@Component({
    selector: 'app-mapChoices-component',
    standalone: true,
    imports: [NgForOf, NgClass, NgIf, ModesComponent, FormsModule],
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
})
export class MapComponent {
    /* TODO : Creer des interfaces ou services et mettre la logique dedans*/
    size: 'small' | 'medium' | 'large';
    mapSize: number;
    mapName: string;
    MAPSIZE: { SMALL: number; MEDIUM: number; LARGE: number } = {
        SMALL: 10,
        MEDIUM: 15,
        LARGE: 20,
    };
    nbItems: number;
    NBITEMS: { SMALL: number; MEDIUM: number; LARGE: number } = {
        SMALL: 2,
        MEDIUM: 4,
        LARGE: 6,
    };
    isHovered = false;
    selectedMode: string;
    showErrorMessage: { entryError: boolean; nameError: boolean } = {
        entryError: false,
        nameError: false,
    };

    // constructor(private http: HttpClient) {}

    /* TODO: Creer une inteface*/
    sizeConversion(size: 'small' | 'medium' | 'large'): void {
        console.log('Button clicked, Size :', size);
        switch (size) {
            case 'small':
                this.mapSize = this.MAPSIZE.SMALL;
                this.nbItems = this.NBITEMS.SMALL;
                break;
            case 'medium':
                this.mapSize = this.MAPSIZE.MEDIUM;
                this.nbItems = this.NBITEMS.MEDIUM;
                break;
            case 'large':
                this.mapSize = this.MAPSIZE.LARGE;
                this.nbItems = this.NBITEMS.LARGE;

                break;
            default:
                console.error('Invalid size value:', size);
                break;
        }
    }
    redirectToEditView() {
        const params = new URLSearchParams();
        if (this.mapSize !== undefined) {
            params.set('mapSize', this.mapSize.toString());
        }
        if (this.selectedMode !== undefined) {
            params.set('mode', this.selectedMode);
        } else {
            this.showErrorMessage.entryError = true;
            return;
        }
        window.location.href = `/game-creation/size=${this.mapSize}/:mode=${this.selectedMode}`;
    }

    onModeSelected($event: string) {
        this.selectedMode = $event;
    }

    // checkMapNameAvailability() {
    //     this.http.get(`/api/check-map-name?name=${this.mapName}`).subscribe((response: unknown) => {
    //         this.showErrorMessage.nameError = response.isTaken;
    //     });
    //}
}
