import { Component } from '@angular/core';

@Component({
    selector: 'app-map',
    standalone: true,
    imports: [],
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
})
export class MapComponent {
    map: number[][] = [];
    size: 'small' | 'medium' | 'large';

    sizeConversion(size: 'small' | 'medium' | 'large'): number {
        let convertedSize: number = 0;
        switch (size) {
            case 'small':
                convertedSize = 10;
                break;
            case 'medium':
                convertedSize = 15;
                break;
            case 'large':
                convertedSize = 20;
                break;
            default:
                // Handle unexpected values (optional)
                console.error('Invalid size value:', size);
                break;
        }
        return convertedSize;
    }

    ngOnInit() {
        this.createMap();
    }

    createMap(size: 'small' | 'medium' | 'large') {
        const mapSize = this.sizeConversion(size);
        for (let i = 0; i < mapSize; i++) {
            const row: number[] = [];
            for (let j = 0; j < mapSize; j++) {
                row.push(0);
            }
            this.map.push(row);
        }
    }
}
