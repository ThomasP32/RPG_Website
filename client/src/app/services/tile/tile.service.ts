import { Injectable } from '@angular/core';
import { MapCounterService } from '@app/services/map-counter/map-counter.service';
import { Cell } from '@common/map-cell';
import { ItemCategory, TileCategory } from '@common/map.types';

@Injectable({
    providedIn: 'root',
})
export class TileService {
    constructor(private mapCounterService: MapCounterService) {
        this.mapCounterService = mapCounterService;
    }

    placeTile(map: Cell[][], rowIndex: number, colIndex: number, selectedTile: string) {
        const cell = map[rowIndex][colIndex];
        if (['wall', 'water', 'ice', 'door'].includes(selectedTile)) {
            if (cell.item && ['wall', 'door'].includes(selectedTile)) {
                this.mapCounterService.releaseItem(cell.item);
                cell.item = undefined;
            }

            if (selectedTile === 'door') {
                if (cell.door?.isDoor) {
                    cell.door.isOpen = !cell.door.isOpen;
                } else {
                    cell.door = { isOpen: false, isDoor: true };
                }
            } else {
                cell.door = { isDoor: false, isOpen: false };
            }
            cell.tileType = this.convertTileValue(selectedTile);
            if (cell.isStartingPoint) {
                this.mapCounterService.updateCounters(true, 'add');
                cell.isStartingPoint = false;
            }
        }
    }

    eraseTile(map: Cell[][], rowIndex: number, colIndex: number, defaultTile: string) {
        const cell = map[rowIndex][colIndex];

        cell.tileType = this.convertTileValue(defaultTile);

        if (cell.item) {
            this.mapCounterService.releaseItem(cell.item);
            cell.item = undefined;
        }

        cell.door = { isDoor: false, isOpen: false };
        if (cell.isStartingPoint) {
            this.mapCounterService.updateCounters(true, 'add');
            cell.isStartingPoint = false;
        }
    }

    moveItem(map: any[][], from: { rowIndex: number; colIndex: number }, to: { rowIndex: number; colIndex: number }) {
        map[to.rowIndex][to.colIndex].item = map[from.rowIndex][from.colIndex].item;
        map[from.rowIndex][from.colIndex].item = undefined;
    }
    setItem(map: any[][], item: ItemCategory, to: { rowIndex: number; colIndex: number }) {
        map[to.rowIndex][to.colIndex].item = item;
        if (item === ItemCategory.Random) {
            this.mapCounterService.itemsCounter--;
            this.mapCounterService.randomItemCounter--;
        } else {
            this.mapCounterService.useItem(item);
        }
    }

    setStartingPoint(map: any[][], rowIndex: number, colIndex: number) {
        map[rowIndex][colIndex].isStartingPoint = !map[rowIndex][colIndex].isStartingPoint;
        if (!map[rowIndex][colIndex].isStartingPoint) {
            this.mapCounterService.updateCounters(true, 'add');
        } else {
            this.mapCounterService.updateCounters(true, 'remove');
        }
    }

    removeStartingPoint(map: any[][], rowIndex: number, colIndex: number) {
        map[rowIndex][colIndex].isStartingPoint = false;
        this.mapCounterService.updateCounters(true, 'add');
    }

    convertTileValue(tileValue: String): TileCategory {
        switch (tileValue) {
            case 'wall':
                return TileCategory.Wall;
            case 'ice':
                return TileCategory.Ice;
            case 'water':
                return TileCategory.Water;
            case 'door':
                return TileCategory.Door;
            default:
                return TileCategory.Floor;
        }
    }
}
