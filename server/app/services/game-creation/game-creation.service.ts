import { ALL_ITEMS, BONUS_REDUCTION, HALF, MapConfig, MapSize, SUFFIX_INCREMENT, SUFFIX_VALUE } from '@common/constants';
import { Game, Player } from '@common/game';
import { ItemCategory, TileCategory } from '@common/map.types';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class GameCreationService {
    private gameRooms: Record<string, Game> = {};

    getGameById(gameId: string): Game {
        const game = this.gameRooms[gameId];
        if (!game) {
            return null;
        }
        return game;
    }

    getGames(): Game[] {
        return Object.values(this.gameRooms);
    }

    getPlayer(gameId: string, playerSocketId: string): Player {
        const game = this.getGameById(gameId);
        return game.players.filter((player) => player.socketId === playerSocketId)[0];
    }

    addGame(game: Game): void {
        if (this.doesGameExist(game.id)) {
            return;
        }
        this.gameRooms[game.id] = game;
    }

    doesGameExist(gameId: string): boolean {
        return gameId in this.gameRooms;
    }

    addPlayerToGame(player: Player, gameId: string): Game {
        const game = this.getGameById(gameId);

        const exactMatchPlayers = game.players.filter((existingPlayer) => existingPlayer.name === player.name);
        if (exactMatchPlayers.length === 0) {
            this.gameRooms[gameId].players.push(player);
            return game;
        }
        const baseName = player.name;
        const matchingPlayers = game.players.filter((existingPlayer) => {
            return existingPlayer.name === baseName || existingPlayer.name.startsWith(`${baseName}-`);
        });
        let maxSuffix = 0;
        matchingPlayers.forEach((existingPlayer) => {
            const match = existingPlayer.name.match(new RegExp(`^${baseName}-(\\d+)$`));
            if (match) {
                const suffix = parseInt(match[1], SUFFIX_VALUE);
                maxSuffix = Math.max(maxSuffix, suffix);
            } else if (existingPlayer.name === baseName) {
                maxSuffix = Math.max(maxSuffix, 1);
            }
        });

        if (matchingPlayers.length > 0) {
            player.name = `${baseName}-${maxSuffix + SUFFIX_INCREMENT}`;
        }

        this.gameRooms[gameId].players.push(player);
        return game;
    }

    addRandomItemsToGame(gameId: string): void {
        const game = this.getGameById(gameId);

        const currentItems = game.items;
        const availableItems = ALL_ITEMS.filter((item) => !currentItems.some((currentItem) => currentItem.category === item));

        game.items = currentItems.map((currentItem) => {
            if (currentItem.category === ItemCategory.Random) {
                const randomIndex = Math.floor(Math.random() * availableItems.length);
                const newItem = availableItems.splice(randomIndex, 1)[0];
                return {
                    coordinate: currentItem.coordinate,
                    category: newItem,
                };
            }
            return currentItem;
        });
    }

    isPlayerHost(socketId: string, gameId: string): boolean {
        return this.getGameById(gameId).hostSocketId === socketId;
    }

    handlePlayerLeaving(client: Socket, gameId: string): Game {
        const game = this.getGameById(gameId);
        if (game.hasStarted) {
            game.players = game.players.map((player) => {
                return player.socketId === client.id ? { ...player, isActive: false } : player;
            });
        } else {
            game.players = game.players.filter((player) => player.socketId !== client.id);
            if (!this.isMaxPlayersReached(game.players, gameId)) {
                game.isLocked = false;
            }
        }
        return this.getGameById(gameId);
    }

    initializeGame(gameId: string): void {
        this.setOrder(gameId);
        this.setStartingPoints(gameId);
        this.addRandomItemsToGame(gameId);
        this.getGameById(gameId).hasStarted = true;
        this.getGameById(gameId).isLocked = true;
    }

    setOrder(gameId: string): void {
        const game = this.getGameById(gameId);
        const updatedPlayers = game.players.sort((player1, player2) => {
            const speedDifference = player2.specs.speed - player1.specs.speed;
            return speedDifference === 0 ? Math.random() - HALF : speedDifference;
        });
        updatedPlayers.forEach((player, index) => {
            player.turn = index;
        });
        game.players = updatedPlayers;
    }

    setStartingPoints(gameId: string): void {
        const game = this.getGameById(gameId);
        const nPlayers = game.players.length;
        while (game.startTiles.length > nPlayers) {
            const randomIndex = Math.floor(Math.random() * game.startTiles.length);
            game.startTiles.splice(randomIndex, 1);
        }
        let startTilesLeft = [...game.startTiles];
        game.players.forEach((player) => {
            const randomIndex = Math.floor(Math.random() * startTilesLeft.length);
            player.position.x = startTilesLeft[randomIndex].coordinate.x;
            player.position.y = startTilesLeft[randomIndex].coordinate.y;
            player.initialPosition.x = startTilesLeft[randomIndex].coordinate.x;
            player.initialPosition.y = startTilesLeft[randomIndex].coordinate.y;
            if (
                game.tiles.some(
                    (tile) =>
                        tile.coordinate.x === startTilesLeft[randomIndex].coordinate.x &&
                        tile.coordinate.y === startTilesLeft[randomIndex].coordinate.y &&
                        tile.category === TileCategory.Ice,
                )
            ) {
                player.specs.attack -= BONUS_REDUCTION;
                player.specs.defense -= BONUS_REDUCTION;
            }
            startTilesLeft.splice(randomIndex, 1);
        });
    }

    isGameStartable(gameId: string): boolean {
        const game = this.getGameById(gameId);
        const mapSize = Object.values(MapSize).find((size) => MapConfig[size].size === game.mapSize.x);

        if (mapSize) {
            const activePlayersCount = game.players.filter((player) => player.isActive).length;
            return activePlayersCount >= MapConfig[mapSize].minPlayers;
        }
        return false;
    }

    isMaxPlayersReached(players: Player[], gameId: string): boolean {
        const game = this.getGameById(gameId);
        const mapSize = Object.values(MapSize).find((size) => MapConfig[size].size === game.mapSize.x);
        return mapSize && players.length === MapConfig[mapSize].maxPlayers;
    }

    lockGame(gameId: string): void {
        this.gameRooms[gameId].isLocked = true;
    }

    deleteRoom(gameId: string): void {
        delete this.gameRooms[gameId];
    }
}
