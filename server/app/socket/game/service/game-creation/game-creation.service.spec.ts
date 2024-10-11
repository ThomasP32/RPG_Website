import { Avatar, Bonus, GameRoom, Player } from '@common/game';
import { Coordinate, ItemCategory, Mode, TileCategory } from '@common/map.types';
import { Test, TestingModule } from '@nestjs/testing';
import * as sinon from 'sinon';
import { stub } from 'sinon'; 
import { Socket } from 'socket.io';
import { GameCreationService } from './game-creation.service';

describe('GameCreationService', () => {
    let service: GameCreationService;
    let player: Player;
    let specs: any;
    let gameRoom: GameRoom;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [GameCreationService],
        }).compile();

        service = module.get<GameCreationService>(GameCreationService);

        specs = {
            life: 100,
            speed: 10,
            attack: 15,
            defense: 5,
            attackBonus: Bonus.D4,
            defenseBonus: Bonus.D6,
            movePoints: 3,
            actions: 2,
        };

        player = {
            socketId: 'player-1',
            name: 'Player 1',
            avatar: Avatar.Avatar1,
            isActive: true,
            position: { x: 0, y: 0 },
            specs,
            inventory: [],
            turn: 1,
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
            nEvasions: 0,
            nLifeTaken: 0,
            nLifeLost: 0,
        };

        gameRoom = {
            id: 'room-1',
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
        };
    });

    it('should create a game room and add a player with unique avatar', () => {
        const coordinate: Coordinate = { x: 5, y: 5 };
        player = { ...player, position: coordinate };
        gameRoom.players.push(player);


        service.addGame(gameRoom);
        expect(service['gameRooms']['room-1']).toEqual(gameRoom);
    });

    it('should mark a player as inactive on disconnect and delete the room', () => {
        gameRoom.players.push(player);
        service.addGame(gameRoom);

        const mockSocket = sinon.createStubInstance(Socket);
        (mockSocket as any).id = 'player-1';
        stub(mockSocket, 'rooms').value(new Set(['room-1']));

        service.handlePlayerDisconnect(mockSocket as unknown as Socket);
        expect(service['gameRooms']['room-1'].players[0].isActive).toBe(false);

        service.deleteRoom('room-1');
        expect(service['gameRooms']['room-1']).toBeUndefined();
    });

    it('should keep the player unchanged if socketId does not match and delete the room', () => {
        const player2: Player = { ...player, socketId: 'player-2' }; 
        gameRoom.players.push(player, player2);
        service.addGame(gameRoom);

        const mockSocket = sinon.createStubInstance(Socket);
        (mockSocket as any).id = 'player-1';
        stub(mockSocket, 'rooms').value(new Set(['room-1']));

        service.handlePlayerDisconnect(mockSocket as unknown as Socket);

        expect(service['gameRooms']['room-1'].players[1]).toEqual(player2);

        service.deleteRoom('room-1');
        expect(service['gameRooms']['room-1']).toBeUndefined();
    });

    it('should add a player with a unique name to the game', () => {
        service.addGame(gameRoom);
        service.addPlayerToGame(player, 'room-1');

        expect(service['gameRooms']['room-1'].players.length).toBe(1);
        expect(service['gameRooms']['room-1'].players[0].name).toBe('Player 1');
    });

    it('should add a player with a duplicate name and rename them', () => {
        const player2: Player = { ...player, socketId: 'player-2', name: 'Player 1', avatar: Avatar.Avatar2 };
        gameRoom.players.push(player);

        service.addGame(gameRoom);
        service.addPlayerToGame(player2, 'room-1');

        expect(service['gameRooms']['room-1'].players.length).toBe(2);
        expect(service['gameRooms']['room-1'].players[1].name).toBe('Player 1-(2)');
    });

    it('should return false if socketId equals gameId in isPlayerHost', () => {
        const result = service.isPlayerHost('room-1', 'room-1');
        expect(result).toBe(false);
    });

    it('should return true if socketId is host in isPlayerHost', () => {
        service.addGame(gameRoom);
        const result = service.isPlayerHost('host-id', 'room-1');
        expect(result).toBe(true);
    });

    it('should continue if gameId is not found in handlePlayerDisconnect', () => {
        const mockSocket = sinon.createStubInstance(Socket);
        (mockSocket as any).id = 'player-1';
        stub(mockSocket, 'rooms').value(new Set(['non-existent-game']));

        const result = service.handlePlayerDisconnect(mockSocket as unknown as Socket);
        expect(result).toBeUndefined();
    });

    it('should mark the player as inactive in handlePlayerDisconnect', () => {
        gameRoom.players.push(player);
        service.addGame(gameRoom);

        const mockSocket = sinon.createStubInstance(Socket);
        (mockSocket as any).id = 'player-1';
        stub(mockSocket, 'rooms').value(new Set(['room-1']));

        service.handlePlayerDisconnect(mockSocket as unknown as Socket);
        expect(service['gameRooms']['room-1'].players[0].isActive).toBe(false);
    });
});
