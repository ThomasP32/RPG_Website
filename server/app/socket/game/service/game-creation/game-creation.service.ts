import { MapConfig, MapSize } from '@common/constants';
import { Game, Player } from '@common/game';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class GameCreationService {
    private gameRooms: Record<string, Game> = {};

    getGameById(gameId: string): Game {
        const game = this.gameRooms[gameId];
        if (!game) {
            console.log(`Game with ID ${gameId} not found.`);
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
                const suffix = parseInt(match[1], 10);
                maxSuffix = Math.max(maxSuffix, suffix);
            } else if (existingPlayer.name === baseName) {
                maxSuffix = Math.max(maxSuffix, 1);
            }
        });

        if (matchingPlayers.length > 0) {
            player.name = `${baseName}-${maxSuffix + 1}`;
        }

        this.gameRooms[gameId].players.push(player);
        return game;
    }

    isPlayerHost(socketId: string, gameId: string): boolean {
        return this.getGameById(gameId).hostSocketId === socketId;
    }

    handlePlayerLeaving(client: Socket, gameId: string): Game {
        const game = this.getGameById(gameId);
        if (game.hasStarted) {
            const combatRoomId = `${gameId}-combat`;
            if (client.rooms.has(combatRoomId)) {
                client.leave(combatRoomId);
            }
            game.players = game.players.map((player) => {
                if (player.socketId === client.id) {
                    return { ...player, isActive: false };
                }
                return player;
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
        this.getGameById(gameId).hasStarted = true;
        this.getGameById(gameId).isLocked = true;
    }

    setOrder(gameId: string): void {
        const game = this.getGameById(gameId);
        const updatedPlayers = game.players.sort((player1, player2) => {
            const speedDifference = player2.specs.speed - player1.specs.speed;
            if (speedDifference === 0) {
                return Math.random() - 0.5;
            }
            return speedDifference;
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

        if (mapSize) {
            return players.length === MapConfig[mapSize].maxPlayers;
        }
        return false;
    }

    lockGame(gameId: string): void {
        this.gameRooms[gameId].isLocked = true;
    }

    deleteRoom(gameId: string): void {
        delete this.gameRooms[gameId];
    }
}
