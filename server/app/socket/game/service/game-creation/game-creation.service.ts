import { GameRoom, Player } from '@common/game';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class GameCreationService {
    private gameRooms: Record<string, GameRoom> = {};

    addGame(game: GameRoom): void {
        this.gameRooms[game.id] = game;
    }

    addPlayerToGame(player: Player, gameId: string): GameRoom {
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

    handlePlayerDisconnect(client: Socket): GameRoom {
        const gameRooms = client.rooms;
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

    deleteRoom(gameId: string): void {
        delete this.gameRooms[gameId];
    }
}
