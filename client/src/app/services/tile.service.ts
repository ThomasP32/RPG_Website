import { Injectable } from '@angular/core';
import { MapCounterService } from './map-counter.service';

@Injectable({
    providedIn: 'root',
})
export class TileService {
    constructor(private mapCounterService: MapCounterService) {}

    placeTile(map: any[][], rowIndex: number, colIndex: number, selectedTile: string) {
        if (selectedTile) {
            if (map[rowIndex][colIndex].item && (selectedTile === 'wall' || selectedTile === 'door')) {
                this.mapCounterService.updateCounters(map[rowIndex][colIndex].item, 'add');
                map[rowIndex][colIndex].item = undefined;
            }
            map[rowIndex][colIndex].value = selectedTile;
        }
    }

    eraseTile(map: any[][], rowIndex: number, colIndex: number, defaultTile: string) {
        map[rowIndex][colIndex].value = defaultTile;
        this.mapCounterService.updateCounters(map[rowIndex][colIndex].item, 'add');
        map[rowIndex][colIndex].item = undefined;
    }

    moveItem(map: any[][], from: { rowIndex: number; colIndex: number }, to: { rowIndex: number; colIndex: number }) {
        map[to.rowIndex][to.colIndex].item = map[from.rowIndex][from.colIndex].item;
        map[from.rowIndex][from.colIndex].item = undefined;
    }
    setItem(map: any[][], item: string, to: { rowIndex: number; colIndex: number }) {
        map[to.rowIndex][to.colIndex].item = item;
    }
}
