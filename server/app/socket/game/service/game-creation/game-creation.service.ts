import { Game, Player } from '@common/game';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class GameCreationService {
    private gameRooms: Record<string, Game> = {};

    addGame(game: Game): void {
        this.gameRooms[game.id] = game;
        console.log(this.gameRooms[0]);
    }

    doesGameExist(gameId: string): boolean {
        return !!this.gameRooms[gameId];
    }

    addPlayerToGame(player: Player, gameId: string): Game {
        const game = this.gameRooms[gameId];
        const existingPlayers = game.players.filter((existingPlayer) => {
            const baseName = existingPlayer.name.split('-')[0];
            return baseName === player.name.split('-')[0];
        });
        if (existingPlayers.length > 0) {
            player.name = `${player.name}-(${existingPlayers.length + 1})`;
        }
        this.gameRooms[gameId].players.push(player);
        return game;
    }

    isPlayerHost(socketId: string, gameId: string): boolean {
        if (socketId === gameId) {
            return false;
        }
        return this.gameRooms[gameId].hostSocketId === socketId;
    }

    handlePlayerDisconnect(client: Socket): Game {
        const gameRooms = Array.from(client.rooms).filter((roomId) => roomId !== client.id);
        for (const gameId of gameRooms) {
            if (!this.gameRooms[gameId]) {
                continue;
            }
            this.gameRooms[gameId].players = this.gameRooms[gameId].players.map((player) => {
                if (player.socketId === client.id) {
                    return { ...player, isActive: false };
                } else {
                    return player;
                }
            });
            return this.gameRooms[gameId];
        }
    }

    getGamebyId(gameId: string): Game {
        return this.gameRooms[gameId];
    }

    deleteRoom(gameId: string): void {
        delete this.gameRooms[gameId];
    }
}
