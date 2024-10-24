import { Game } from '@common/game';
import { Coordinate, TileCategory } from '@common/map.types';
import { Inject, Injectable } from '@nestjs/common';
import { GameCreationService } from '../game-creation/game-creation.service';
import { DIRECTIONS } from '@common/directions';

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

    updateTurnCounter(gameId: string): void {
        const game = this.gameCreationService.getGame(gameId);
        game.nTurns++;
        game.currentTurn++;
        if (game.currentTurn >= game.players.length) {
            game.currentTurn = 0;
        }
    }

    getMoves(gameId: string, playerName: string): Coordinate[] {
        const game = this.gameCreationService.getGame(gameId);
        const player = game.players.find((p) => p.name === playerName);

        if (!player || !player.isActive) {
            return [];
        }

        const moves = this.runDijkstra(player.position, game, player.specs.movePoints);
        const accessibleMoves: Coordinate[] = [];
        moves.forEach((value, key) => {
            const [x, y] = key.split(',').map(Number);
            accessibleMoves.push({ x: x, y: y });
        });
        return accessibleMoves;
    }

    getMove(gameId: string, playerName: string, destination: Coordinate, isPreviewMode: boolean): Coordinate[] {
        const game = this.gameCreationService.getGame(gameId);
        const player = game.players.find((p) => p.name === playerName);
        let shortestPath: Coordinate[];

        // si le joueur a pas besoin de jouer 
        if (!player || !player.isActive) {
            return [];
        }

        const shortestPaths = this.runDijkstra(player.position, game, player.specs.life);

        shortestPaths.forEach((value) => {
            const lastPosition = value.path[value.path.length - 1];
            if (lastPosition.x === destination.x && lastPosition.y === destination.y) {
                shortestPath = value.path;
            }
        });

        // si la tuile est innaccessible
        if (!shortestPath) {
            return [];
        } else {
            if (isPreviewMode) {
                return shortestPath;
            }

            const finalPath: Coordinate[] = [];

            for (const position of shortestPath) {
                if (this.getTileWeight(position, game) === 0 && Math.random() <= 0.1) {
                    finalPath.push(position);
                    break;
                }

                finalPath.push(position);
            }

            return finalPath;
        }
    }

    runDijkstra(start: Coordinate, game: Game, playerPoints: number): Map<string, { path: Coordinate[]; weight: number }> {
        const shortestPaths = new Map<string, { path: Coordinate[]; weight: number }>();
        const visited = new Set<string>();
        const startKey = this.coordinateToKey(start);

        shortestPaths.set(startKey, { path: [start], weight: 0 });

        let toVisit = [{ point: start, weight: 0 }];

        while (toVisit.length > 0) {
            toVisit.sort((a, b) => a.weight - b.weight);
            const { point: currentPoint, weight: currentWeight } = toVisit.shift();
            const currentKey = this.coordinateToKey(currentPoint);

            if (visited.has(currentKey)) {
                continue;
            }

            visited.add(currentKey);

            if (currentWeight > playerPoints) {
                continue;
            }

            const neighbors = this.getNeighbors(currentPoint, game);

            for (const neighbor of neighbors) {
                const neighborKey = this.coordinateToKey(neighbor);

                if (visited.has(neighborKey)) {
                    continue;
                }

                const neighborWeight = currentWeight + this.getTileWeight(neighbor, game);

                if (neighborWeight <= playerPoints) {
                    if (!shortestPaths.has(neighborKey)) {
                        shortestPaths.set(neighborKey, {
                            path: [...(shortestPaths.get(currentKey)?.path || []), neighbor],
                            weight: neighborWeight,
                        });
                    } else if (neighborWeight < shortestPaths.get(neighborKey).weight) {
                        shortestPaths.set(neighborKey, {
                            path: [...(shortestPaths.get(currentKey).path), neighbor],
                            weight: neighborWeight,
                        });
                    }

                    toVisit.push({ point: neighbor, weight: neighborWeight });
                }
            }
        }

        return shortestPaths;
    }

    coordinateToKey(coord: Coordinate): string {
        return `${coord.x},${coord.y}`;
    }

    private getNeighbors(pos: Coordinate, game: Game): Coordinate[] {
        const neighbors: Coordinate[] = [];
        DIRECTIONS.forEach((dir) => {
            const neighbor = { x: pos.x + dir.x, y: pos.y + dir.y };
            if (!this.isOutOfMap(neighbor, game.mapSize) && this.isReachableTile(neighbor, game)) {
                neighbors.push(neighbor);
            }
        });
        return neighbors;
    }

    private isOutOfMap(pos: Coordinate, mapSize: Coordinate): boolean {
        return pos.x < 0 || pos.y < 0 || pos.x >= mapSize.x || pos.y >= mapSize.y;
    }

    isReachableTile(pos: Coordinate, game: Game): boolean {
        for (const tile of game.tiles) {
            if (tile.coordinate.x === pos.x && tile.coordinate.y === pos.y) {
                if (tile.category === TileCategory.Wall) return false;
            }
        }
        for (const door of game.doorTiles) {
            if (door.coordinate.x === pos.x && door.coordinate.y === pos.y && !door.isOpened) {
                return false;
            }
        }
        for (const player of game.players) {
            if (player.position.x === pos.x && player.position.y === pos.y) {
                return false;
            }
        }
        return true;
    }

    private getTileWeight(pos: Coordinate, game: Game): number {
        for (const tile of game.tiles) {
            if (tile.coordinate.x === pos.x && tile.coordinate.y === pos.y) {
                if (tile.category === TileCategory.Water) return 2;
                if (tile.category === TileCategory.Ice) return 0;
            }
        }
        return 1;
    }
}
