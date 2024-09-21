import { NgClass, NgForOf, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModesComponent } from '../modes/modes.component';

const SMALL_MAP_SIZE = 10;
const MEDIUM_MAP_SIZE = 15;
const LARGE_MAP_SIZE = 20;
const SMALL_MAP_ITEMS = 2;
const MEDIUM_MAP_ITEMS = 4;
const LARGE_MAP_ITEMS = 6;

export enum MapSize {
    Small = SMALL_MAP_SIZE,
    Medium = MEDIUM_MAP_SIZE,
    Large = LARGE_MAP_SIZE,
}

export enum NbItems {
    Small = SMALL_MAP_ITEMS,
    Medium = MEDIUM_MAP_ITEMS,
    Large = LARGE_MAP_ITEMS,
}

@Component({
    selector: 'app-mapChoices-component',
    standalone: true,
    imports: [NgForOf, NgClass, NgIf, ModesComponent, FormsModule],
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
})
export class MapComponent {
    size: 'small' | 'medium' | 'large';
    mapSize: MapSize;
    mapSizeType: typeof MapSize = MapSize;
    mapName: string;
    nbItems: number;
    isHovered = false;
    selectedMode: string;
    showErrorMessage: { entryError: boolean; nameError: boolean } = {
        entryError: false,
        nameError: false,
    };

    // constructor(private http: HttpClient) {}

    sizeConversion(size: 'small' | 'medium' | 'large'): void {
        console.log('Button clicked, Size :', size);
        switch (size) {
            case 'small':
                this.mapSize = MapSize.Small;
                this.nbItems = NbItems.Small;
                break;
            case 'medium':
                this.mapSize = MapSize.Medium;
                this.nbItems = NbItems.Medium;
                break;
            case 'large':
                this.mapSize = MapSize.Large;
                this.nbItems = NbItems.Large;
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
