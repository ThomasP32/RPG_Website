import { Injectable } from '@angular/core';
import { Game, Player } from '@common/game';

@Injectable({
    providedIn: 'root',
})
export class EndgameService {
    constructor() {}

    getPlayerTilePercentage(player: Player, game: Game): number {
        return (player.visitedTiles.length / (game.mapSize.x * game.mapSize.y)) * 100;
    }

    gameDurationInMinutes(duration: number): string {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}
