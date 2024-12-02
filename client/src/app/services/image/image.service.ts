import { Injectable } from '@angular/core';
import { Avatar, Bonus } from '@common/game';
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
        return isOpen ? './assets/tiles/door_opened.jpg' : './assets/tiles/door_closed.jpg';
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

    getDiceImage(dice: Bonus): string {
        switch (dice) {
            case Bonus.D4:
                return './assets/icons/d4.png';
            case Bonus.D6:
                return './assets/icons/d6.png';
            default:
                return '';
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
            case ItemCategory.WallBreaker:
                return './assets/items/wallbreaker.png';
            case ItemCategory.Amulet:
                return './assets/items/amulet.png';
            case ItemCategory.Flask:
                return './assets/items/flask.png';
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
            case 'wallbreaker':
                return './assets/items/wallbreaker.png';
            case 'flask':
                return './assets/items/flask.png';
            case 'amulet':
                return './assets/items/amulet.png';
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
                return './assets/pixelcharacters/1_pixelated.png';
            case Avatar.Avatar2:
                return './assets/pixelcharacters/2_pixelated.png';
            case Avatar.Avatar3:
                return './assets/pixelcharacters/3_pixelated.png';
            case Avatar.Avatar4:
                return './assets/pixelcharacters/4_pixelated.png';
            case Avatar.Avatar5:
                return './assets/pixelcharacters/5_pixelated.png';
            case Avatar.Avatar6:
                return './assets/pixelcharacters/6_pixelated.png';
            case Avatar.Avatar7:
                return './assets/pixelcharacters/7_pixelated.png';
            case Avatar.Avatar8:
                return './assets/pixelcharacters/8_pixelated.png';
            case Avatar.Avatar9:
                return './assets/pixelcharacters/9_pixelated.png';
            case Avatar.Avatar10:
                return './assets/pixelcharacters/10_pixelated.png';
            case Avatar.Avatar11:
                return './assets/pixelcharacters/11_pixelated.png';
            case Avatar.Avatar12:
                return './assets/pixelcharacters/12_pixelated.png';
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
                return './assets/icons/fighting.png';
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
