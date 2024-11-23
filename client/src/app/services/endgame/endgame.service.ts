import { Injectable } from '@angular/core';
import { MAX_CHAR, MINUTE, PERCENTAGE } from '@common/constants';
import { Game, GameCtf, Player } from '@common/game';
import { Coordinate } from '@common/map.types';

@Injectable({
    providedIn: 'root',
})
export class EndgameService {
    isSortingAsc: boolean = true;
    sortColumn: number = -1;

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

    sortTable(columnIndex: number): void {
        this.isSortingAsc = this.sortColumn === columnIndex ? !this.isSortingAsc : true;
        this.sortColumn = columnIndex;

        const table = document.getElementById('stats-table');
        if (!table) {
            console.error('Table not found');
            return;
        }

        const tbody = table.getElementsByTagName('tbody')[0];
        if (!tbody) {
            console.error('Table body not found');
            return;
        }

        const rows = Array.from(tbody.rows);

        rows.sort((rowA, rowB) => {
            const cellA = rowA.cells[columnIndex];
            const cellB = rowB.cells[columnIndex];

            if (!cellA || !cellB) return 0;

            const valueA = Number(cellA.textContent?.replace('%', '') ?? 0);
            const valueB = Number(cellB.textContent?.replace('%', '') ?? 0);

            const comparison = valueA - valueB;
            return this.isSortingAsc ? comparison : -comparison;
        });

        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        rows.forEach((row) => tbody.appendChild(row));

        // const fragment = document.createDocumentFragment();
        // rows.forEach((row) => fragment.appendChild(row));
        // tbody.innerHTML = '';
        // tbody.appendChild(fragment);
    }
}
