import { NgClass, NgForOf, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ModesComponent } from '../modes/modes.component';
import { ToEditViewComponent } from '../to-edit-view/to-edit-view.component';

@Component({
    selector: 'map',
    standalone: true,
    imports: [NgForOf, NgClass, NgIf, ModesComponent, ToEditViewComponent],
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
})
export class MapComponent {
    /*TODO : Creer des interfaces ou services et mettre la logique dedans*/
    Map: { value: any; isHovered: boolean }[][] = [];
    size: 'small' | 'medium' | 'large';
    mapSize: number;
    nbPlayers: number;
    nbItems: number;
    isHovered = false;

    /*TODO : changer any pour le type approprié (type créé par nous, probabl grass ou porte, mur etc)*/
    createMap() {
        this.Map = [];
        for (let i = 0; i < this.mapSize; i++) {
            const ROW: { value: any; isHovered: boolean }[] = [];
            for (let j = 0; j < this.mapSize; j++) {
                ROW.push({ value: null, isHovered: false });
            }
            this.Map.push(ROW);
        }
        console.log('Map:', this.Map);
    }
    /*TODO: Pas de chiffres magiques!!! Creer une inteface*/
    sizeConversion(size: 'small' | 'medium' | 'large'): void {
        console.log('Button clicked, Size :', size);
        switch (size) {
            case 'small':
                this.mapSize = 10;
                this.nbItems = 2;
                this.nbPlayers = 1 | 2;
                break;
            case 'medium':
                this.mapSize = 15;
                this.nbItems = 4;
                this.nbPlayers = 2 | 3 | 4;
                break;
            case 'large':
                this.mapSize = 20;
                this.nbItems = 6;
                this.nbPlayers = 2 | 3 | 4 | 5 | 6;
                break;
            default:
                console.error('Invalid size value:', size);
                break;
        }
        this.createMap();
    }
}
