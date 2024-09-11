import { NgForOf } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'map',
    standalone: true,
    imports: [NgForOf],
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
})
export class MapComponent {
    map: number[][] = [];
    size: 'small' | 'medium' | 'large';
    mapSize: number;
    nbPlayers: number;
    nbItems: number;

    createMap() {
        this.map = [];
        for (let i = 0; i < this.mapSize; i++) {
            const row: any[] = [];
            for (let j = 0; j < this.mapSize; j++) {
                row.push(null);
            }
            this.map.push(row);
        }
        console.log('Map:', this.map);
    }

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
