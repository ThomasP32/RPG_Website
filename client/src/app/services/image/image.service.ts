import { Injectable } from '@angular/core';
import { Avatar } from '@common/game';

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

                const hasWallLeft = map[rowIndex]?.[colIndex - 1]?.value === 'wall';
                const hasWallRight = map[rowIndex]?.[colIndex + 1]?.value === 'wall';
                const hasWallAbove = map[rowIndex - 1]?.[colIndex]?.value === 'wall';
                const hasWallBelow = map[rowIndex + 1]?.[colIndex]?.value === 'wall';

                if (doorState === 'open') {
                    if (hasWallLeft && hasWallRight && !(hasWallAbove && hasWallBelow)) {
                        return './assets/tiles/door_y.png';
                    } else if (hasWallAbove && hasWallBelow && !(hasWallLeft && hasWallRight)) {
                        return './assets/tiles/door_x.png';
                    }
                } else {
                    if (hasWallLeft && hasWallRight && !(hasWallAbove && hasWallBelow)) {
                        return './assets/tiles/door_x.png';
                    } else if (hasWallAbove && hasWallBelow && !(hasWallLeft && hasWallRight)) {
                        return './assets/tiles/door_y.png';
                    }
                }
                return './assets/tiles/door_y.png';
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

    // va falloir update les routes pour les petits avatars pixelisé
    getPlayerImage(avatar: Avatar): string {
        switch (avatar) {
            case Avatar.Avatar1:
                return './assets/characters/1.png';
            case Avatar.Avatar2:
                return './assets/characters/2.png';
            case Avatar.Avatar3:
                return './assets/characters/3.png';
            case Avatar.Avatar4:
                return './assets/characters/4.png';
            case Avatar.Avatar5:
                return './assets/characters/5.png';
            case Avatar.Avatar6:
                return './assets/characters/6.png';
            case Avatar.Avatar7:
                return './assets/characters/7.png';
            case Avatar.Avatar8:
                return './assets/characters/8.png';
            case Avatar.Avatar9:
                return './assets/characters/9.png';
            case Avatar.Avatar10:
                return './assets/characters/10.png';
            case Avatar.Avatar11:
                return './assets/characters/11.png';
            case Avatar.Avatar12:
                return './assets/characters/12.png';
            default:
                return '';
        }
    }
}
