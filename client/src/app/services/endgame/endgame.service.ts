import { Injectable } from '@angular/core';
import { MAX_CHAR, MINUTE, PERCENTAGE } from '@common/constants';
import { Game, Player } from '@common/game';
import { Coordinate } from '@common/map.types';

@Injectable({
    providedIn: 'root',
})
export class EndgameService {
    constructor() {}

    getPlayerTilePercentage(player: Player, game: Game): number {
        return (player.visitedTiles.length / (game.mapSize.x * game.mapSize.y)) * PERCENTAGE;
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

        return (uniqueVisitedTiles.size / totalTiles) * 100;
    }
}
