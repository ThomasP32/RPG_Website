import { Injectable } from '@angular/core';
import { MAX_CHAR, MINUTE, PERCENTAGE } from '@common/constants';
import { Game, GameCtf, Player } from '@common/game';
import { Coordinate } from '@common/map.types';

interface HTMLTableRowElement extends HTMLElement {
    cells: HTMLCollectionOf<HTMLTableCellElement>;
}

@Injectable({
    providedIn: 'root',
})
export class EndgameService {
    isSortingAsc: boolean = true;

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
        if (totalDoors === 0) {
            return 0;
        }
        return Math.floor((openedDoors / totalDoors) * PERCENTAGE);
    }

    getFlagPickupPlayers(game: GameCtf): number {
        const uniquePlayers = new Set<string>();
        game.nPlayersCtf.forEach((player: Player) => {
            uniquePlayers.add(player.socketId);
        });
        return uniquePlayers.size;
    }

    sortTable(n: number): void {
        this.isSortingAsc = !this.isSortingAsc;
        let table: HTMLTableElement | null = document.getElementById('stats-table') as HTMLTableElement;
        if (!table) {
            console.error('Table not found');
            return;
        }

        let rows: HTMLCollectionOf<HTMLTableRowElement> = table.rows;
        let switching: boolean = true;
        let switchCount: number = 0;

        while (switching) {
            switching = false;
            for (let i = 1; i < rows.length - 1; i++) {
                if (this.shouldSwitch(rows, i, n)) {
                    this.switchRows(rows, i);
                    switching = true;
                    switchCount++;
                    break;
                }
            }
            if (switchCount === 0 && this.isSortingAsc) {
                switching = true;
            }
        }
    }

    private shouldSwitch(rows: HTMLCollectionOf<HTMLTableRowElement>, i: number, n: number): boolean {
        let x = rows[i].getElementsByTagName('td')[n];
        let y = rows[i + 1].getElementsByTagName('td')[n];

        if (!x || !y) {
            console.error(`Invalid cell at row ${i}`);
            return false;
        }

        if (this.isSortingAsc) {
            return x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase();
        } else {
            return x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase();
        }
    }

    private switchRows(rows: HTMLCollectionOf<HTMLTableRowElement>, i: number): void {
        const parent = rows[i].parentNode;
        if (parent) {
            parent.insertBefore(rows[i + 1], rows[i]);
        }
    }
}
