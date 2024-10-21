import { Game, Player } from '@common/game';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

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
        game.availableAvatars = game.availableAvatars.filter((avatar) => game.players.every((player) => player.avatar !== avatar));
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
        game.availableAvatars = game.availableAvatars.filter((avatar) => avatar !== player.avatar);
        return game;
    }

    isPlayerHost(socketId: string, gameId: string): boolean {
        return this.getGame(gameId).hostSocketId === socketId;
    }

    handlePlayerDisconnect(client: Socket): Game {
        const gameRooms = Array.from(client.rooms).filter((roomId) => roomId !== client.id);
        for (const gameId of gameRooms) {
            this.getGame(gameId).players = this.getGame(gameId).players.map((player) => {
                if (player.socketId === client.id) {
                    return { ...player, isActive: false };
                } else {
                    return player;
                }
            });
            return this.getGame(gameId);
        }
    }

    initializeGame(gameId: string): void {
        this.setOrder(gameId);
        this.setStartingPoints(gameId);
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

    deleteRoom(gameId: string): void {
        delete this.gameRooms[gameId];
    }
}
