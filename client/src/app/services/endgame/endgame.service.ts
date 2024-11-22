import { Injectable } from '@angular/core';
import { MAX_CHAR, MINUTE, PERCENTAGE } from '@common/constants';
import { Game, Player } from '@common/game';
import { Coordinate } from '@common/map.types';

interface HTMLTableRowElement extends HTMLElement {
    cells: HTMLCollectionOf<HTMLTableCellElement>;
}

@Injectable({
    providedIn: 'root',
})
export class EndgameService {
    isSortingAsc: Boolean = true;

    constructor() {}

    getPlayerTilePercentage(player: Player, game: Game): number {
        return Math.floor((player.visitedTiles.length / (game.mapSize.x * game.mapSize.y)) * PERCENTAGE);
    }

    gameDurationInMinutes(duration: number): string {
        const minutes = Math.floor(duration / MINUTE);
        const seconds = duration % MINUTE;
        return `${minutes.toString().padStart(MAX_CHAR, '0')}:${seconds.toString().padStart(MAX_CHAR, '0')}`;
    }

    gameTilePercentage(game: Game): number {
        const totalTiles = game.mapSize.x * game.mapSize.y;

        const uniqueVisitedTiles = new Set<string>();

        game.players.forEach((player: Player) => {
            player.visitedTiles.forEach((tile: Coordinate) => {
                uniqueVisitedTiles.add(`${tile.x},${tile.y}`);
            });
        });

        return Math.floor((uniqueVisitedTiles.size / totalTiles) * PERCENTAGE);
    }

    gameDoorPercentage(game: Game): number {
        const totalDoors = game.doorTiles.length;
        const uniqueOpenedDoors = new Set<string>();
        game.nDoorsManipulated.forEach((door: Coordinate) => {
            uniqueOpenedDoors.add(`${door.x},${door.y}`);
        });
        const openedDoors = uniqueOpenedDoors.size;
        return Math.floor((openedDoors / totalDoors) * PERCENTAGE);
    }

    sortTable(n: number): void {
        console.log('Sorting table by column', n);
        this.isSortingAsc = !this.isSortingAsc;
        let table: HTMLTableElement | null = document.getElementById('stats-table') as HTMLTableElement;
        if (!table) {
            console.error('Table not found');
            return;
        }

        let switching: boolean = true;
        let shouldSwitch: boolean = false;
        let switchCount: number = 0;
        let rows: HTMLCollectionOf<HTMLTableRowElement> = table.rows;
        let x: HTMLTableCellElement;
        let y: HTMLTableCellElement;
        let i: number;

        while (switching) {
            switching = false;

            for (i = 1; i < rows.length - 1; i++) {
                shouldSwitch = false;

                x = rows[i].getElementsByTagName('td')[n] as HTMLTableCellElement;
                y = rows[i + 1].getElementsByTagName('td')[n] as HTMLTableCellElement;

                if (!x || !y) {
                    console.error(`Invalid cell at row ${i}`);
                    continue;
                }

                if (this.isSortingAsc) {
                    if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                        shouldSwitch = true;
                        break;
                    }
                } else {
                    if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                        shouldSwitch = true;
                        break;
                    }
                }
            }

            if (shouldSwitch) {
                const parent = rows[i].parentNode;
                if (parent) {
                    parent.insertBefore(rows[i + 1], rows[i]);
                    switching = true;
                    switchCount++;
                }
            } else {
                if (switchCount === 0 && this.isSortingAsc) {
                    switching = true;
                }
            }
        }
    }
}
