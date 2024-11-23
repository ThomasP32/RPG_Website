import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModesComponent } from '@app/components/modes/modes.component';
import { MapConfig, MapSize } from '@common/constants';

@Component({
    selector: 'app-map-choices-component',
    standalone: true,
    imports: [NgClass, FormsModule, ModesComponent],
    templateUrl: './create-map-modal.component.html',
    styleUrls: ['./create-map-modal.component.scss'],
})
export class CreateMapModalComponent {
    size: 'small' | 'medium' | 'large';
    mapSize: number;
    mapName: string;
    nbItems: number;
    isHovered = false;
    selectedMode: string;

    constructor(private readonly router: Router) {
        this.router = router;
    }

    sizeConversion(size: 'small' | 'medium' | 'large'): void {
        switch (size) {
            case 'small':
                this.mapSize = MapConfig[MapSize.SMALL].size;
                this.nbItems = MapConfig[MapSize.SMALL].nbItems;
                break;
            case 'medium':
                this.mapSize = MapConfig[MapSize.MEDIUM].size;
                this.nbItems = MapConfig[MapSize.MEDIUM].nbItems;
                break;
            case 'large':
                this.mapSize = MapConfig[MapSize.LARGE].size;
                this.nbItems = MapConfig[MapSize.LARGE].nbItems;
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
        this.router.navigate(['/creation'], { queryParams: { size: this.mapSize, mode: this.selectedMode } });
    }

    canCreateGame(): boolean {
        return this.mapSize !== undefined && this.selectedMode !== undefined;
    }

    onModeSelected($event: string) {
        this.selectedMode = $event;
    }
}
