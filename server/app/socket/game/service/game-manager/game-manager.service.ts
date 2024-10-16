// import { Direction, Game, Specs } from '@common/game';
import { Coordinate } from '@common/map.types';
import { Inject, Injectable } from '@nestjs/common';
import { GameCreationService } from '../game-creation/game-creation.service';

@Injectable()
export class GameManagerService {
    @Inject(GameCreationService) private gameCreationService: GameCreationService;

    updatePosition(gameId: string, playerName: string, position: { x: number; y: number }): void {
        const game = this.gameCreationService.getGame(gameId);
        game.players.forEach((player) => {
            if (player.name === playerName) {
                player.position = position;
            }
        });
    }

    getMovements(gameId: string, playerName: string): Coordinate[] {
        const game = this.gameCreationService.getGame(gameId);
        let movements: Coordinate[] = [];
        game.players.forEach((player) => {
            if (player.name === playerName) {
                // movements.push(...this.getMovement(Direction.Left, player.position, player.specs, game));
                // movements.push(...this.getMovement(Direction.Right, player.position, player.specs, game));
                // movements.push(...this.getMovement(Direction.Up, player.position, player.specs, game));
                // movements.push(...this.getMovement(Direction.Down, player.position, player.specs, game));
            }
        });
        return movements;
    }

    updateTurnCounter(gameId: string): void {
        const game = this.gameCreationService.getGame(gameId);
        game.nTurns++;
        game.currentTurn++;
        if (game.currentTurn >= game.players.length) {
            game.currentTurn = 0;
        }
    }

    // getMovement(direction: Direction, position: Coordinate, specs: Specs, game: Game): Coordinate[] {
    //     let start = 1;
    //     let end = direction === Direction.Up || direction === Direction.Down ? game.mapSize.y : game.mapSize.x;

    //     const initialPosition = { x: position.x, y: position.y };
    //     let moveWeight = 0;
    //     let movements: Coordinate[] = [];

    //     if (direction === Direction.Left || direction === Direction.Down) {
    //         start = -end;
    //         end = 0;
    //     }

    //     const isHorizontal = direction === Direction.Left || direction === Direction.Right;
        
    //     for (
    //         let i = start;
    //         isHorizontal
    //             ? direction === Direction.Right
    //                 ? initialPosition.x + i < end
    //                 : initialPosition.x + i >= 0
    //             : direction === Direction.Up
    //             ? initialPosition.y + i < end
    //             : initialPosition.y + i >= 0;
    //         i++
    //     ) {
    //         let isUnreachable = false;
    //         let tileWeight = 1;

    //         const xPosition = isHorizontal ? initialPosition.x + i : initialPosition.x;
    //         const yPosition = isHorizontal ? initialPosition.y : initialPosition.y + i;

    //         for (let tile of game.tiles) {
    //             if (tile.coordinate.x === xPosition && tile.coordinate.y === yPosition) {
    //                 if (tile.category === TileCategory.Water) {
    //                     tileWeight = 2;
    //                 } else if (tile.category === TileCategory.Ice) {
    //                     tileWeight = 0;
    //                 } else if (tile.category === TileCategory.Wall) {
    //                     isUnreachable = true;
    //                 }
    //             }
    //         }

    //         for (let door of game.doorTiles) {
    //             if (door.coordinate.x === xPosition && door.coordinate.y === yPosition) {
    //                 if (!door.isOpened) {
    //                     isUnreachable = true;
    //                 }
    //             }
    //         }

    //         if (isUnreachable || moveWeight + tileWeight > specs.movePoints) {
    //             break;
    //         }

    //         moveWeight += tileWeight;
    //         movements.push({ x: xPosition, y: yPosition });
    //     }

    //     return movements;
    // }

}
