import { Injectable } from '@angular/core';
import { Game } from '@common/game';
import { Coordinate, GameDescriptions, ItemCategory, TileCategory } from '@common/map.types';

@Injectable({
    providedIn: 'root',
})
export class GameInfosService {
    constructor() {}

    getTileDescription(position: Coordinate, loadedMap: Game): string {
        const terrainDescription = this.getNormalTileDescription(position, loadedMap);
        if (terrainDescription) {
            return terrainDescription;
        }
        const itemDescription = this.getItemDescription(position, loadedMap);
        if (itemDescription) {
            return itemDescription;
        }
        const doorDescription = this.getDoorDescription(position, loadedMap);
        if (doorDescription) {
            return doorDescription;
        }

        const playerDescription = this.getPlayerDescription(position, loadedMap);
        if (playerDescription) {
            return playerDescription;
        }

        return GameDescriptions.FloorTile;
    }

    getItemDescription(position: Coordinate, loadedMap: Game): string | null {
        for (const item of loadedMap.items) {
            if (item.coordinate.x === position.x && item.coordinate.y === position.y) {
                switch (item.category) {
                    case ItemCategory.Amulet:
                        return GameDescriptions.Amulet;
                    case ItemCategory.Armor:
                        return GameDescriptions.Armor;
                    case ItemCategory.Flag:
                        return GameDescriptions.Flag;
                    case ItemCategory.IceSkates:
                        return GameDescriptions.IceSkates;
                    case ItemCategory.Flask:
                        return GameDescriptions.Flask;
                    case ItemCategory.Sword:
                        return GameDescriptions.Sword;
                    case ItemCategory.WallBreaker:
                        return GameDescriptions.WallBreaker;
                }
            }
        }
        return null;
    }

    private getNormalTileDescription(position: Coordinate, loadedMap: Game): string | null {
        for (const tile of loadedMap.tiles) {
            if (tile.coordinate.x === position.x && tile.coordinate.y === position.y) {
                switch (tile.category) {
                    case TileCategory.Water:
                        return GameDescriptions.WaterTile;
                    case TileCategory.Ice:
                        return GameDescriptions.IceTile;
                    case TileCategory.Wall:
                        return GameDescriptions.WallTile;
                }
            }
        }
        return null;
    }

    private getDoorDescription(position: Coordinate, loadedMap: Game): string | null {
        for (const doorTile of loadedMap.doorTiles) {
            if (doorTile.coordinate.x === position.x && doorTile.coordinate.y === position.y) {
                if (!doorTile.isOpened) {
                    return GameDescriptions.ClosedDoor;
                }
                if (doorTile.isOpened) {
                    return GameDescriptions.OpenedDoor;
                }
            }
        }
        return null;
    }

    private getPlayerDescription(position: Coordinate, loadedMap: Game): string | null {
        for (const player of loadedMap.players) {
            if (player.position.x === position.x && player.position.y === position.y) {
                return `nom du joueur: ${player.name}`;
            }
        }
        return null;
    }
}
