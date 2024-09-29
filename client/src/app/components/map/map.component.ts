import { NgClass, NgForOf, NgIf } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MapSize, NbItems } from '@app/interfaces/map-choices';
import { ModesComponent } from '../modes/modes.component';

@Component({
    selector: 'app-map-choices-component',
    standalone: true,
    imports: [NgForOf, NgClass, NgIf, FormsModule, ModesComponent],
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
    @Output() closeChoices = new EventEmitter<void>();
    selectedMode: string;
    showErrorMessage: { entryError: boolean; nameError: boolean } = {
        entryError: false,
        nameError: false,
    };

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
        window.location.href = `/creation/size=${this.mapSize}/:mode=${this.selectedMode}`;
    }

    onModeSelected($event: string) {
        this.selectedMode = $event;
    }

    closeComponent() {
        this.closeChoices.emit();
    }
}
