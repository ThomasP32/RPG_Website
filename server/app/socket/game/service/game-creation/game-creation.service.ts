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
        const existingPlayers = game.players.filter((existingPlayer) => {
            const baseName = existingPlayer.name.split('-')[0];
            return baseName === player.name.split('-')[0];
        });
        if (existingPlayers.length > 0) {
            player.name = `${player.name}-${existingPlayers.length + 1}`;
        }
        this.gameRooms[gameId].players.push(player);
        console.log('Player', player.name, 'has been added to the game', gameId);
        return game;
    }

    isPlayerHost(socketId: string, gameId: string): boolean {
        return this.getGameById(gameId).hostSocketId === socketId;
    }

    handlePlayerDisconnect(client: Socket, gameId: string): Game {
        const game = this.getGameById(gameId);
        if (game.hasStarted) {
            game.players = game.players.map((player) => {
                if (player.socketId === client.id) {
                    return { ...player, isActive: false };
                }
                return player;
            });
        } else {
            game.players = game.players.filter((player) => player.socketId !== client.id);
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
            startTilesLeft.splice(randomIndex, 1);
        });
    }

    isGameStartable(gameId: string): boolean {
        const game = this.getGameById(gameId);
        if (game.mapSize.x === SMALL_MAP_SIZE) {
            return game.players.filter((player) => player.isActive).length === SMALL_MAP_PLAYERS_MIN_MAX;
        } else if (game.mapSize.x === MEDIUM_MAP_SIZE) {
            return game.players.filter((player) => player.isActive).length >= MEDIUM_MAP_PLAYERS_MIN;
        } else if (game.mapSize.x === LARGE_MAP_SIZE) {
            return game.players.filter((player) => player.isActive).length >= LARGE_MAP_PLAYERS_MIN;
        } else {
            return false;
        }
    }

    isMaxPlayersReached(players: Player[], gameId: string): boolean {
        const game = this.getGameById(gameId);
        if (game.mapSize.x === SMALL_MAP_SIZE) {
            return players.length === SMALL_MAP_PLAYERS_MIN_MAX;
        } else if (game.mapSize.x === MEDIUM_MAP_SIZE) {
            return players.length === MEDIUM_MAP_PLAYERS_MAX;
        } else if (game.mapSize.x === LARGE_MAP_SIZE) {
            return players.length === LARGE_MAP_PLAYERS_MAX;
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
