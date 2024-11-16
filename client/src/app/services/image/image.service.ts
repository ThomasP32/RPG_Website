import { Injectable } from '@angular/core';
import { Avatar } from '@common/game';
import { ItemCategory, TileCategory } from '@common/map.types';

@Injectable({
    providedIn: 'root',
})
export class ImageService {
    constructor() {}

    loadTileImage(tile: string): string {
        switch (tile) {
            case 'door':
                return './assets/tiles/door_closed.jpg';
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

    getDoorImage(isOpen: boolean): string {
        if (isOpen) {
            return './assets/tiles/door_opened.jpg';
        } else {
            return './assets/tiles/door_closed.jpg';
        }
    }

    getTileImage(tileValue: TileCategory, rowIndex: number, colIndex: number, map: any[][]): string {
        switch (tileValue) {
            case 'wall':
                return './assets/tiles/wall.png';
            case 'ice':
                return './assets/tiles/ice1.jpg';
            case 'water':
                return './assets/tiles/water.png';
            case 'door':
                return this.getDoorImage(map[rowIndex][colIndex].door.isOpen);
            default:
                return './assets/tiles/floor.png';
        }
    }

    getItemImage(item: ItemCategory): string {
        switch (item) {
            case ItemCategory.Armor:
                return './assets/items/armor.png';
            case ItemCategory.Mask:
                return './assets/items/mask.png';
            case ItemCategory.IceSkates:
                return './assets/items/iceskates.png';
            case ItemCategory.Acidgun:
                return './assets/items/acidgun.png';
            case ItemCategory.Key:
                return './assets/items/keysilver.png';
            case ItemCategory.Hat:
                return './assets/items/hat.png';
            case ItemCategory.Random:
                return './assets/items/randomchest.png';
            case ItemCategory.Flag:
                return './assets/items/flag.png';
            default:
                return '';
        }
    }

    getItemImageByString(item: string): string {
        switch (item) {
            case 'armor':
                return './assets/items/armor.png';
            case 'mask':
                return './assets/items/mask.png';
            case 'iceskates':
                return './assets/items/iceskates.png';
            case 'acidgun':
                return './assets/items/acidgun.png';
            case 'key':
                return './assets/items/keysilver.png';
            case 'hat':
                return './assets/items/hat.png';
            case 'random':
                return './assets/items/randomchest.png';
            default:
                return '';
        }
    }

    getStartingPointImage(): string {
        return './assets/tiles/startingpoint.png';
    }

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

    getPixelatedPlayerImage(avatar: Avatar): string {
        switch (avatar) {
            case Avatar.Avatar1:
                return './assets/pixelcharacters/1.png';
            case Avatar.Avatar2:
                return './assets/pixelcharacters/2.png';
            case Avatar.Avatar3:
                return './assets/pixelcharacters/3.png';
            case Avatar.Avatar4:
                return './assets/pixelcharacters/4.png';
            case Avatar.Avatar5:
                return './assets/pixelcharacters/5.png';
            case Avatar.Avatar6:
                return './assets/pixelcharacters/6.png';
            case Avatar.Avatar7:
                return './assets/pixelcharacters/7.png';
            case Avatar.Avatar8:
                return './assets/pixelcharacters/8.png';
            case Avatar.Avatar9:
                return './assets/pixelcharacters/9.png';
            case Avatar.Avatar10:
                return './assets/pixelcharacters/10.png';
            case Avatar.Avatar11:
                return './assets/pixelcharacters/11.png';
            case Avatar.Avatar12:
                return './assets/pixelcharacters/12.png';
            default:
                return '';
        }
    }
}
