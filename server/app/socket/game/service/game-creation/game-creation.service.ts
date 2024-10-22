import { Game, Player } from '@common/game';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

const SMALL_MAP_SIZE = 10;
const MEDIUM_MAP_SIZE = 15;
const LARGE_MAP_SIZE = 20;
const SMALL_MAP_PLAYERS_MIN_MAX = 2;
const MEDIUM_MAP_PLAYERS_MIN = 2;
const MEDIUM_MAP_PLAYERS_MAX = 4;
const LARGE_MAP_PLAYERS_MIN = 2;
const LARGE_MAP_PLAYERS_MAX = 6;

@Injectable()
export class GameCreationService {
    private gameRooms: Record<string, Game> = {};

    getGame(gameId: string): Game {
        return this.gameRooms[gameId];
    }

    getGames(): Game[] {
        return Object.values(this.gameRooms);
    }

    addGame(game: Game): void {
        this.gameRooms[game.id] = game;
    }

    doesGameExist(gameId: string): boolean {
        return gameId in this.gameRooms;
    }

    addPlayerToGame(player: Player, gameId: string): Game {
        const game = this.getGame(gameId);
        const existingPlayers = game.players.filter((existingPlayer) => {
            const baseName = existingPlayer.name.split('-')[0];
            return baseName === player.name.split('-')[0];
        });
        if (existingPlayers.length > 0) {
            player.name = `${player.name}-(${existingPlayers.length + 1})`;
        }
        this.getGame(gameId).players.push(player);
        return game;
    }

    isPlayerHost(socketId: string, gameId: string): boolean {
        return this.getGame(gameId).hostSocketId === socketId;
    }
    handlePlayerDisconnect(client: Socket, gameId: string): Game {
        const game = this.getGame(gameId);
        if (game.hasStarted) {
            game.players = game.players.map((player) => {
                if (player.socketId === client.id) {
                    game.connections = game.connections.filter((connection) => connection !== client.id);
                    return { ...player, isActive: false };
                } else {
                    return player;
                }
            });
        } else {
            game.players = game.players.filter((player) => {
                return player.socketId !== client.id;
            });
            game.connections = game.connections.filter((connection) => connection !== client.id);
        }
        return this.getGame(gameId);
    }

    initializeGame(gameId: string): void {
        this.setOrder(gameId);
        this.setStartingPoints(gameId);
        this.getGame(gameId).hasStarted = true;
        this.getGame(gameId).isLocked = true;
    }

    setOrder(gameId: string): void {
        const game = this.getGame(gameId);
        const updatedPlayers = game.players.sort((player1, player2) => {
            const speedDifference = player2.specs.speed - player1.specs.speed;
            if (speedDifference === 0) {
                return Math.random() - 0.5;
            }
            return speedDifference;
        });
        game.players = updatedPlayers;
    }

    setStartingPoints(gameId: string): void {
        const game = this.getGame(gameId);
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
            startTilesLeft.splice(randomIndex, 1);
        });
    }

    isGameStartable(gameId: string): boolean {
        const game = this.getGame(gameId);
        if (game.mapSize.x === SMALL_MAP_SIZE) {
            return game.players.length === SMALL_MAP_PLAYERS_MIN_MAX;
        } else if (game.mapSize.x === MEDIUM_MAP_SIZE) {
            return game.players.length > MEDIUM_MAP_PLAYERS_MIN && game.players.length < MEDIUM_MAP_PLAYERS_MAX;
        } else if (game.mapSize.x === LARGE_MAP_SIZE) {
            return game.players.length > LARGE_MAP_PLAYERS_MIN && game.players.length < LARGE_MAP_PLAYERS_MAX;
        } else {
            return false;
        }
    }

    isMaxPlayersReached(connections: string[], gameId: string): boolean {
        const game = this.getGame(gameId);
        if (game.mapSize.x === SMALL_MAP_SIZE) {
            return connections.length === SMALL_MAP_PLAYERS_MIN_MAX;
        } else if (game.mapSize.x === MEDIUM_MAP_SIZE) {
            return connections.length === MEDIUM_MAP_PLAYERS_MAX;
        } else if (game.mapSize.x === LARGE_MAP_SIZE) {
            return connections.length === LARGE_MAP_PLAYERS_MAX;
        } else {
            return false;
        }
    }

    lockGame(gameId: string): void {
        this.gameRooms[gameId].isLocked = true;
    }

    deleteRoom(gameId: string): void {
        delete this.gameRooms[gameId];
    }
}
