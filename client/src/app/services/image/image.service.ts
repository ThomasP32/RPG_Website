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
            case ItemCategory.Sword:
                return './assets/items/sword.png';
            case ItemCategory.IceSkates:
                return './assets/items/iceskates.png';
            case ItemCategory.GrapplingHook:
                return './assets/items/grapplinghook.png';
            case ItemCategory.TimeTwister:
                return './assets/items/timetwister.png';
            case ItemCategory.Bomb:
                return './assets/items/bomb.png';
            case ItemCategory.Random:
                return './assets/items/randomitem.png';
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
            case 'sword':
                return './assets/items/sword.png';
            case 'grapplinghook':
                return './assets/items/grapplinghook.png';
            case 'bomb':
                return './assets/items/bomb.png';
            case 'timetwister':
                return './assets/items/timetwister.png';
            case 'iceskates':
                return './assets/items/iceskates.png';
            case 'random':
                return './assets/items/randomitem.png';
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

    getIconImage(icon: string): string {
        switch (icon) {
            case 'attack':
                return './assets/icons/sword.png';
            case 'defense':
                return './assets/icons/shield.png';
            case 'health':
                return './assets/icons/heart.png';
            case 'speed':
                return './assets/icons/speed.png';
            case 'battle':
                return './assets/icons/fight.png';
            case 'action':
                return './assets/icons/action.png';
            case 'robot':
                return './assets/icons/robot.png';
            case 'host':
                return './assets/icons/crown.png';
            default:
                return '';
        }
    }
}
