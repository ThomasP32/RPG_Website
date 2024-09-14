import { NgClass, NgForOf, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ModesComponent } from '../modes/modes.component';

@Component({
    selector: 'map',
    standalone: true,
    imports: [NgForOf, NgClass, NgIf, ModesComponent],
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
})
export class MapComponent {
    /*TODO : Creer des interfaces ou services et mettre la logique dedans*/
    Map: { value: any; isHovered: boolean }[][] = [];
    size: 'small' | 'medium' | 'large';
    mapSize: number;
    nbItems: number;
    isHovered = false;
    selectedMode: string;

    createMap() {
        this.Map = [];
        for (let i = 0; i < this.mapSize; i++) {
            const ROW: { value: null; isHovered: boolean }[] = [];
            for (let j = 0; j < this.mapSize; j++) {
                ROW.push({ value: null, isHovered: false });
            }
            this.Map.push(ROW);
        }
    }
    /*TODO: Pas de chiffres magiques!!! Creer une inteface*/
    sizeConversion(size: 'small' | 'medium' | 'large'): void {
        console.log('Button clicked, Size :', size);
        switch (size) {
            case 'small':
                this.mapSize = 10;
                this.nbItems = 2;
                break;
            case 'medium':
                this.mapSize = 15;
                this.nbItems = 4;
                break;
            case 'large':
                this.mapSize = 20;
                this.nbItems = 6;
                break;
            default:
                console.error('Invalid size value:', size);
                break;
        }
        this.createMap();
    }
    redirectToEditView() {
        console.log('button clicked');
        const params = new URLSearchParams();
        params.set('mapSize', this.mapSize.toString());
        params.set('mode', this.selectedMode);

        window.location.href = `/game-creation/size=${this.mapSize}/:mode=${this.selectedMode}`;
    }

    onModeSelected($event: string) {
        this.selectedMode = $event;
        console.log('Mode selected:', $event);
    }
}
