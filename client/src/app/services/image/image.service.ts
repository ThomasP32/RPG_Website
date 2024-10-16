import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ImageService {
    constructor() {}

    loadTileImage(tile: string): string {
        switch (tile) {
            case 'door':
                return './assets/tiles/door_y.png';
            case 'wall':
                return './assets/tiles/wall.png';
            case 'ice':
                return './assets/tiles/ice1.jpg';
            case 'water':
                return './assets/tiles/water.png';
            default:
                return '';
        }
    }

    getTileImage(tileValue: string, rowIndex: number, colIndex: number, map: any[][]): string {
        switch (tileValue) {
            case 'door': {
                const doorState = map[rowIndex][colIndex].doorState;
                return doorState === 'open' ? './assets/tiles/door_x.png' : './assets/tiles/door_y.png';
            }
            case 'wall':
                return './assets/tiles/wall.png';
            case 'ice':
                return './assets/tiles/ice1.jpg';
            case 'water':
                return './assets/tiles/water.png';
            default:
                return './assets/tiles/floor.png';
        }
    }

    getItemImage(item: string): string {
        switch (item) {
            case 'vest':
                return './assets/items/vest.png';
            case 'mask':
                return './assets/items/mask.png';
            case 'jar':
                return './assets/items/jar.png';
            case 'acidgun':
                return './assets/items/acidgun.png';
            case 'key':
                return './assets/items/keysilver.png';
            case 'hat':
                return './assets/items/hat.png';
            case 'random':
                return './assets/items/randomchest.png';
            case 'starting-point':
                return './assets/tiles/startingpoint.png';
            default:
                return '';
        }
    }
}
