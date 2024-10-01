import { NgClass, NgForOf, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModesComponent } from '@app/components/modes/modes.component';

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
    selector: 'app-map-choices-component',
    standalone: true,
    imports: [NgForOf, NgClass, NgIf, FormsModule, ModesComponent],
    templateUrl: './create-map-modal.component.html',
    styleUrls: ['./create-map-modal.component.scss'],
})
export class MapComponent {
    size: 'small' | 'medium' | 'large';
    mapSize: MapSize;
    mapSizeType: typeof MapSize = MapSize;
    mapName: string;
    nbItems: number;
    isHovered = false;
    selectedMode: string;

    constructor(private router: Router) {}

    sizeConversion(size: 'small' | 'medium' | 'large'): void {
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
                throw new Error(`Invalid size value: ${size}`);
        }
    }
    redirectToEditView() {
        const params = new URLSearchParams();
        if (this.mapSize !== undefined) {
            params.set('mapSize', this.mapSize.toString());
        }
        if (this.selectedMode !== undefined) {
            params.set('mode', this.selectedMode);
        }
        this.router.navigate([`/creation/size=${this.mapSize}/:mode=${this.selectedMode}`]);
    }

    canCreateGame(): boolean {
        return this.mapSize !== undefined && this.selectedMode !== undefined;
    }

    onModeSelected($event: string) {
        this.selectedMode = $event;
    }
}
