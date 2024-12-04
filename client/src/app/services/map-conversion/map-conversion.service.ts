import { Injectable } from '@angular/core';
import { MapConfig, MapSize } from '@common/constants';

@Injectable({
    providedIn: 'root',
})
export class MapConversionService {
    constructor() {}

    convertToMapSize(size: number | 'small' | 'medium' | 'large'): MapSize {
        if (typeof size === 'number') {
            switch (size) {
                case 10:
                    return MapSize.SMALL;
                case 15:
                    return MapSize.MEDIUM;
                case 20:
                    return MapSize.LARGE;
                default:
                    console.warn(`Invalid numeric size: ${size}, defaulting to SMALL`);
                    return MapSize.SMALL;
            }
        } else {
            switch (size) {
                case 'small':
                    return MapSize.SMALL;
                case 'medium':
                    return MapSize.MEDIUM;
                case 'large':
                    return MapSize.LARGE;
                default:
                    console.warn(`Invalid size string: ${size}, defaulting to SMALL`);
                    return MapSize.SMALL;
            }
        }
    }

    convertNumberToString(size: number): string {
        switch (size) {
            case 10:
                return 'Petite';
            case 15:
                return 'Moyenne';
            case 20:
                return 'Large';
            default:
                return 'Petite';
        }
    }
    getMaxPlayers(mapSize: number): number {
        const size = this.convertToMapSize(mapSize);
        return MapConfig[size].maxPlayers;
    }

    getNbItems(mapSize: number): number {
        const size = this.convertToMapSize(mapSize);
        return MapConfig[size].nbItems;
    }

    getPlayerCountMessage(mapSize: number): string {
        const size = this.convertToMapSize(mapSize);
        const { minPlayers, maxPlayers } = MapConfig[size];
        return minPlayers === maxPlayers ? `${minPlayers} joueurs` : `${minPlayers} à ${maxPlayers} joueurs`;
    }
}
