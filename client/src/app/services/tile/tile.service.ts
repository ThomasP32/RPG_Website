import { Injectable } from '@angular/core';
import { MapCounterService } from '@app/services/map-counter/map-counter.service';
import { Cell } from '@common/map-cell';
import { TileCategory } from '@common/map.types';
/* eslint-disable no-unused-vars */
@Injectable({
    providedIn: 'root',
})
export class TileService {
    constructor(private mapCounterService: MapCounterService) {}

    placeTile(map: Cell[][], rowIndex: number, colIndex: number, selectedTile: string) {
        const cell = map[rowIndex][colIndex];
        if (['wall', 'water', 'ice', 'door'].includes(selectedTile)) {
            if (cell.item && ['wall', 'door'].includes(selectedTile)) {
                this.mapCounterService.updateCounters(true, cell.item, 'add');
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
                this.mapCounterService.updateCounters(true, undefined, 'add');
                cell.isStartingPoint = false;
            }
        }
    }

    eraseTile(map: Cell[][], rowIndex: number, colIndex: number, defaultTile: string) {
        const cell = map[rowIndex][colIndex];

        cell.tileType = this.convertTileValue(defaultTile);

        if (cell.item) {
            this.mapCounterService.updateCounters(false, cell.item, 'add');
            cell.item = undefined;
        }

        cell.door = { isDoor: false, isOpen: false };
        if (cell.isStartingPoint) {
            this.mapCounterService.updateCounters(true, undefined, 'add');
            cell.isStartingPoint = false;
        }
    }

    moveItem(map: any[][], from: { rowIndex: number; colIndex: number }, to: { rowIndex: number; colIndex: number }) {
        map[to.rowIndex][to.colIndex].item = map[from.rowIndex][from.colIndex].item;
        map[from.rowIndex][from.colIndex].item = undefined;
        this.setStartingPoint(map, from.rowIndex, from.colIndex);
    }
    setItem(map: any[][], item: string, to: { rowIndex: number; colIndex: number }) {
        map[to.rowIndex][to.colIndex].item = item;
    }

    setStartingPoint(map: any[][], rowIndex: number, colIndex: number) {
        map[rowIndex][colIndex].isStartingPoint = !map[rowIndex][colIndex].isStartingPoint;
        if (!map[rowIndex][colIndex].isStartingPoint) {
            this.mapCounterService.updateCounters(true, undefined, 'add');
        } else {
            this.mapCounterService.updateCounters(true, undefined, 'remove');
        }
    }

    convertTileValue(tileValue: string): TileCategory {
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
