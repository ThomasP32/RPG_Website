import { DoorTile } from '@app/http/model/schemas/map/tiles.schema';
import { ICE_ATTACK_PENALTY, ICE_DEFENSE_PENALTY } from '@common/constants';
import { CORNER_DIRECTIONS, DIRECTIONS, MovesMap } from '@common/directions';
import { Game, Player } from '@common/game';
import { Coordinate, ItemCategory, Mode, TileCategory } from '@common/map.types';
import { Inject, Injectable } from '@nestjs/common';
import { GameCreationService } from '../game-creation/game-creation.service';

@Injectable()
export class GameManagerService {
    @Inject(GameCreationService) private gameCreationService: GameCreationService;
    public hasFallen: boolean = false;

    updatePosition(gameId: string, playerSocket: string, path: Coordinate[]): void {
        const game = this.gameCreationService.getGameById(gameId);
        const player = game.players.find((player) => player.socketId === playerSocket);
        if (player) {
            this.updatePlayerPosition(player, path, game);
        }
    }

    updatePlayerPosition(player: Player, path: Coordinate[], game: Game): void {
        path.forEach((position) => {
            player.specs.movePoints -= this.getTileWeight(position, game);
            if (!player.visitedTiles.some((tile) => tile.x === position.x && tile.y === position.y)) {
                player.visitedTiles.push(position);
            }
        });
        player.position = path[path.length - 1];
    }

    updateTurnCounter(gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        game.currentTurn++;
        if (game.currentTurn >= game.players.length) {
            game.currentTurn = 0;
        }
    }

    updatePlayerActions(gameId: string, playerSocket: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        const player = game.players.find((player) => player.socketId === playerSocket);
        if (player) {
            player.specs.actions--;
        }
    }

    getMoves(
        gameId: string,
        playerSocket: string,
    ): [
        string,
        {
            path: Coordinate[];
            weight: number;
        },
    ][] {
        const game = this.gameCreationService.getGameById(gameId);
        const player = game.players.find((p) => p.socketId === playerSocket);
        if (!player?.isActive) {
            return [];
        }
        const moves = this.runDijkstra(player.position, game, player.specs.movePoints);
        const mapAsArray = Array.from(moves.entries());
        return mapAsArray;
    }

    getMove(gameId: string, playerSocket: string, destination: Coordinate): Coordinate[] {
        const game = this.gameCreationService.getGameById(gameId);
        const player = game.players.find((p) => p.socketId === playerSocket);
        let shortestPath: Coordinate[];

        if (!player?.isActive) {
            return [];
        }

        const shortestPaths = this.runDijkstra(player.position, game, player.specs.movePoints);

        shortestPaths.forEach((value) => {
            const lastPosition = value.path[value.path.length - 1];
            if (lastPosition.x === destination.x && lastPosition.y === destination.y) {
                shortestPath = value.path;
            }
        });

        if (!shortestPath) {
            return [];
        } else {
            const finalPath: Coordinate[] = [];
            const hasSkates = player.inventory.includes(ItemCategory.IceSkates);
            shortestPath.shift();
            for (const position of shortestPath) {
                if (this.onTileItem(position, game)) {
                    finalPath.push(position);
                    break;
                } else if (this.getTileWeight(position, game) === 0 && Math.random() <= 0.1 && !hasSkates) {
                    this.hasFallen = true;
                    finalPath.push(position);
                    break;
                } else {
                    finalPath.push(position);
                }
            }

            return finalPath;
        }
    }

    runDijkstra(start: Coordinate, game: Game, playerPoints: number): MovesMap {
        const { shortestPaths, visited, toVisit } = this.initializeDijkstra(start);

        while (toVisit.length > 0) {
            toVisit.sort((a, b) => a.weight - b.weight);
            const { point: currentPoint, weight: currentWeight } = toVisit.shift();
            const currentKey = this.coordinateToKey(currentPoint);

            if (visited.has(currentKey) || currentWeight > playerPoints) continue;

            visited.add(currentKey);

            const neighbors = this.getNeighbors(currentPoint, game);

            for (const neighbor of neighbors) {
                const neighborKey = this.coordinateToKey(neighbor);

                if (visited.has(neighborKey)) continue;

                const neighborWeight = currentWeight + this.getTileWeight(neighbor, game);

                if (neighborWeight <= playerPoints) {
                    this.updateShortestPaths(shortestPaths, neighborKey, currentKey, neighbor, neighborWeight);
                    toVisit.push({ point: neighbor, weight: neighborWeight });
                }
            }
        }
        return shortestPaths;
    }

    private updateShortestPaths(shortestPaths: MovesMap, neighborKey: string, currentKey: string, neighbor: Coordinate, neighborWeight: number) {
        const currentPath = shortestPaths.get(currentKey)?.path || [];
        const newPath = [...currentPath, neighbor];

        if (!shortestPaths.has(neighborKey) || neighborWeight < shortestPaths.get(neighborKey).weight) {
            shortestPaths.set(neighborKey, { path: newPath, weight: neighborWeight });
        }
    }

    private initializeDijkstra(start: Coordinate): {
        shortestPaths: Map<string, { path: Coordinate[]; weight: number }>;
        visited: Set<string>;
        toVisit: { point: Coordinate; weight: number }[];
    } {
        const shortestPaths = new Map<string, { path: Coordinate[]; weight: number }>();
        const visited = new Set<string>();
        const startKey = this.coordinateToKey(start);
        shortestPaths.set(startKey, { path: [start], weight: 0 });
        const toVisit = [{ point: start, weight: 0 }];
        return { shortestPaths, visited, toVisit };
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

    public isOutOfMap(pos: Coordinate, mapSize: Coordinate): boolean {
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
            if (player.isActive && player.position.x === pos.x && player.position.y === pos.y) {
                return false;
            }
        }
        return true;
    }

    private onTileItem(pos: Coordinate, game: Game): boolean {
        return game.items.some((item) => item.coordinate.x === pos.x && item.coordinate.y === pos.y);
    }

    getTileWeight(pos: Coordinate, game: Game): number {
        for (const tile of game.tiles) {
            if (tile.coordinate.x === pos.x && tile.coordinate.y === pos.y) {
                if (tile.category === TileCategory.Water) return 2;
                if (tile.category === TileCategory.Ice) return 0;
            }
        }
        return 1;
    }

    onIceTile(player: Player, gameId: string): boolean {
        return this.gameCreationService
            .getGameById(gameId)
            .tiles.some(
                (tile) => tile.coordinate.x === player.position.x && tile.coordinate.y === player.position.y && tile.category === TileCategory.Ice,
            );
    }

    hasPickedUpFlag(oldInventory: ItemCategory[], newInventory: ItemCategory[]): boolean {
        return !oldInventory.some((item) => item === ItemCategory.Flag) && newInventory.some((item) => item === ItemCategory.Flag);
    }

    getAdjacentPlayers(player: Player, gameId: string): Player[] {
        const game = this.gameCreationService.getGameById(gameId);
        const adjacentPlayers: Player[] = [];
        if (game?.players) {
            game.players.forEach((otherPlayer) => {
                if (otherPlayer.isActive) {
                    if (otherPlayer.socketId !== player.socketId) {
                        const isAdjacent = DIRECTIONS.some(
                            (direction) =>
                                otherPlayer.position.x === player.position.x + direction.x &&
                                otherPlayer.position.y === player.position.y + direction.y,
                        );
                        if (isAdjacent) {
                            adjacentPlayers.push(otherPlayer);
                        }
                    }
                }
            });
        }
        return adjacentPlayers;
    }

    getAdjacentDoors(player: Player, gameId: string): DoorTile[] {
        const game = this.gameCreationService.getGameById(gameId);
        const adjacentDoors: DoorTile[] = [];

        const adjacentPlayers = this.getAdjacentPlayers(player, gameId);

        game.doorTiles.forEach((door) => {
            const isAdjacent = DIRECTIONS.some(
                (direction) => door.coordinate.x === player.position.x + direction.x && door.coordinate.y === player.position.y + direction.y,
            );

            const isOccupied = adjacentPlayers.some(
                (adjPlayer) => adjPlayer.position.x === door.coordinate.x && adjPlayer.position.y === door.coordinate.y,
            );

            if (isAdjacent && !isOccupied) {
                adjacentDoors.push(door);
            }
        });

        return adjacentDoors;
    }

    adaptSpecsForIceTileMove(player: Player, gameId: string, wasOnIceTile: boolean) {
        const isOnIceTile = this.onIceTile(player, gameId);
        const hasSkates = player.inventory.includes(ItemCategory.IceSkates);
        if (isOnIceTile && !wasOnIceTile && !hasSkates) {
            player.specs.attack -= ICE_ATTACK_PENALTY;
            player.specs.defense -= ICE_DEFENSE_PENALTY;
            wasOnIceTile = true;
        } else if (!isOnIceTile && wasOnIceTile && !hasSkates) {
            player.specs.attack += ICE_ATTACK_PENALTY;
            player.specs.defense += ICE_DEFENSE_PENALTY;
            wasOnIceTile = false;
        }
        return wasOnIceTile;
    }

    getFirstFreePosition(start: Coordinate, game: Game): Coordinate | null {
        const allDirections = [...DIRECTIONS, ...CORNER_DIRECTIONS];

        for (const direction of allDirections) {
            const newPosition: Coordinate = {
                x: start.x + direction.x,
                y: start.y + direction.y,
            };
            //@chargé, on empêche l'item de drop sur une case de départ
            const isStartTile = game.startTiles.some((tile) => tile.coordinate.x === newPosition.x && tile.coordinate.y === newPosition.y);

            if (
                !this.isOutOfMap(newPosition, game.mapSize) &&
                this.isReachableTile(newPosition, game) &&
                !this.onTileItem(newPosition, game) &&
                !game.players.some((player) => player.position.x === newPosition.x && player.position.y === newPosition.y) &&
                !isStartTile
            ) {
                return newPosition;
            }
        }
        return null;
    }

    isGameResumable(gameId: string): boolean {
        return (
            this.gameCreationService.getGameById(gameId) &&
            !!this.gameCreationService.getGameById(gameId).players.find((player) => player.isActive && !player.socketId.includes('virtual'))
        );
    }

    checkForWinnerCtf(player: Player, gameId: string): boolean {
        if (this.gameCreationService.getGameById(gameId).mode === Mode.Ctf) {
            if (player.inventory.includes(ItemCategory.Flag)) {
                return player.position.x === player.initialPosition.x && player.position.y === player.initialPosition.y;
            }
        }
        return false;
    }
}
