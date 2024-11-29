import { Injectable } from '@angular/core';
import { MAX_CHAR, MINUTE, PERCENTAGE } from '@common/constants';
import { Game, GameCtf, Player } from '@common/game';
import { Coordinate } from '@common/map.types';
import { GameService } from '../game/game.service';

@Injectable({
    providedIn: 'root',
})
export class EndgameService {
    isCombatSortingAsc: boolean = true;
    isEvasionSortingAsc: boolean = true;
    sortColumn: number = -1;
    isVictoriesSortingAsc: boolean = true;
    isDefeatsSortingAsc: boolean = true;
    isLostLifeSortingAsc: boolean = true;
    isStolenLifeSortingAsc: boolean = true;
    isObjectsSortingAsc: boolean = true;
    isTilesSortingAsc: boolean = true;

    constructor(private gameService: GameService) {
        this.gameService = gameService;
    }

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

    sortCombats(): void {
        this.isCombatSortingAsc = !this.isCombatSortingAsc;
        if (this.isCombatSortingAsc) {
            this.gameService.game.players.sort((a, b) => a.specs.nCombats - b.specs.nCombats);
        } else {
            this.gameService.game.players.sort((a, b) => b.specs.nCombats - a.specs.nCombats);
        }
        this.sortColumn = 4;
    }

    sortEvasions(): void {
        this.isEvasionSortingAsc = !this.isEvasionSortingAsc;
        if (this.isEvasionSortingAsc) {
            this.gameService.game.players.sort((a, b) => a.specs.nEvasions - b.specs.nEvasions);
        } else {
            this.gameService.game.players.sort((a, b) => b.specs.nEvasions - a.specs.nEvasions);
        }
        this.sortColumn = 5;
    }

    sortVictories(): void {
        this.isVictoriesSortingAsc = !this.isVictoriesSortingAsc;
        if (this.isVictoriesSortingAsc) {
            this.gameService.game.players.sort((a, b) => a.specs.nVictories - b.specs.nVictories);
        } else {
            this.gameService.game.players.sort((a, b) => b.specs.nVictories - a.specs.nVictories);
        }
        this.sortColumn = 6;
    }

    sortDefeats(): void {
        this.isDefeatsSortingAsc = !this.isDefeatsSortingAsc;
        if (this.isDefeatsSortingAsc) {
            this.gameService.game.players.sort((a, b) => a.specs.nDefeats - b.specs.nDefeats);
        } else {
            this.gameService.game.players.sort((a, b) => b.specs.nDefeats - a.specs.nDefeats);
        }
        this.sortColumn = 7;
    }

    sortLostLife(): void {
        this.isLostLifeSortingAsc = !this.isLostLifeSortingAsc;
        if (this.isLostLifeSortingAsc) {
            this.gameService.game.players.sort((a, b) => a.specs.nLifeLost - b.specs.nLifeLost);
        } else {
            this.gameService.game.players.sort((a, b) => b.specs.nLifeLost - a.specs.nLifeLost);
        }
        this.sortColumn = 8;
    }

    sortStolenLife(): void {
        this.isStolenLifeSortingAsc = !this.isStolenLifeSortingAsc;
        if (this.isStolenLifeSortingAsc) {
            this.gameService.game.players.sort((a, b) => a.specs.nLifeTaken - b.specs.nLifeTaken);
        } else {
            this.gameService.game.players.sort((a, b) => b.specs.nLifeTaken - a.specs.nLifeTaken);
        }
        this.sortColumn = 9;
    }

    sortObjects(): void {
        this.isObjectsSortingAsc = !this.isObjectsSortingAsc;
        if (this.isObjectsSortingAsc) {
            this.gameService.game.players.sort((a, b) => a.specs.nItemsUsed - b.specs.nItemsUsed);
        } else {
            this.gameService.game.players.sort((a, b) => b.specs.nItemsUsed - a.specs.nItemsUsed);
        }
        this.sortColumn = 10;
    }

    sortVisitedTiles(): void {
        this.isTilesSortingAsc = !this.isTilesSortingAsc;
        if (this.isTilesSortingAsc) {
            this.gameService.game.players.sort((a, b) => a.visitedTiles.length - b.visitedTiles.length);
        } else {
            this.gameService.game.players.sort((a, b) => b.visitedTiles.length - a.visitedTiles.length);
        }
        this.sortColumn = 11;
    }
}
