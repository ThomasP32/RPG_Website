import { Avatar, Game, Player } from '@common/game';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class GameCreationService {
    private gameRooms: Record<string, Game> = {};

    addGame(game: Game): void {
        this.gameRooms[game.id] = game;
        console.log(this.gameRooms[game.id]);
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

    createMockGames(): void {
        const mockGames: Game[] = [
            {
                id: '1234',
                isLocked: false,
                name: 'Test Room',
                description: 'A test game room',
                imagePreview: 'some-image-url',
                mode: Mode.Ctf,
                mapSize: { x: 20, y: 20 },
                startTiles: [{ coordinate: { x: 1, y: 1 } }, { coordinate: { x: 19, y: 19 } }],
                items: [
                    { coordinate: { x: 5, y: 5 }, category: ItemCategory.Flag },
                    { coordinate: { x: 10, y: 10 }, category: ItemCategory.Acidgun },
                ],
                doorTiles: [{ coordinate: { x: 15, y: 15 }, isOpened: false }],
                tiles: [
                    { coordinate: { x: 0, y: 0 }, category: TileCategory.Wall },
                    { coordinate: { x: 1, y: 1 }, category: TileCategory.Water },
                ],
                hostSocketId: 'host-id',
                players: [],
                availableAvatars: [Avatar.Avatar1, Avatar.Avatar2],
                currentTurn: 1,
                nDoorsManipulated: 0,
                visitedTiles: [],
                duration: 0,
                nTurns: 1,
                debug: false,
            },
            {
                id: '4000',
                isLocked: false,
                name: 'Ice Room',
                description: 'A test game room',
                imagePreview: 'some-image-url',
                mode: Mode.Ctf,
                mapSize: { x: 20, y: 20 },
                startTiles: [{ coordinate: { x: 1, y: 1 } }, { coordinate: { x: 19, y: 19 } }],
                items: [
                    { coordinate: { x: 5, y: 5 }, category: ItemCategory.Flag },
                    { coordinate: { x: 10, y: 10 }, category: ItemCategory.Acidgun },
                ],
                doorTiles: [{ coordinate: { x: 15, y: 15 }, isOpened: false }],
                tiles: [
                    { coordinate: { x: 0, y: 0 }, category: TileCategory.Wall },
                    { coordinate: { x: 1, y: 1 }, category: TileCategory.Water },
                ],
                hostSocketId: 'host-id',
                players: [],
                availableAvatars: [Avatar.Avatar1, Avatar.Avatar2],
                currentTurn: 1,
                nDoorsManipulated: 0,
                visitedTiles: [],
                duration: 0,
                nTurns: 1,
                debug: false,
            },
            {
                id: '3564',
                isLocked: false,
                name: 'Lava Room',
                description: 'A test game room',
                imagePreview: 'some-image-url',
                mode: Mode.Ctf,
                mapSize: { x: 20, y: 20 },
                startTiles: [{ coordinate: { x: 1, y: 1 } }, { coordinate: { x: 19, y: 19 } }],
                items: [
                    { coordinate: { x: 5, y: 5 }, category: ItemCategory.Flag },
                    { coordinate: { x: 10, y: 10 }, category: ItemCategory.Acidgun },
                ],
                doorTiles: [{ coordinate: { x: 15, y: 15 }, isOpened: false }],
                tiles: [
                    { coordinate: { x: 0, y: 0 }, category: TileCategory.Wall },
                    { coordinate: { x: 1, y: 1 }, category: TileCategory.Water },
                ],
                hostSocketId: 'host-id',
                players: [],
                availableAvatars: [Avatar.Avatar1, Avatar.Avatar2],
                currentTurn: 1,
                nDoorsManipulated: 0,
                visitedTiles: [],
                duration: 0,
                nTurns: 1,
                debug: false,
            },
        ];
        for (const game of mockGames) {
            this.addGame(game);
        }
    }

    getGamebyId(gameId: string): Game {
        const game = this.gameRooms[gameId];
        if (!game) {
            console.log(`Game with ID ${gameId} not found.`);
            return null;
        }
        return game;
    }

    deleteRoom(gameId: string): void {
        delete this.gameRooms[gameId];
    }
}
