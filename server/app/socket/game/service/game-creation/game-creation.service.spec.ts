import { Avatar, Bonus, Game, Player, Specs } from '@common/game';
import { Coordinate, ItemCategory, Mode, TileCategory } from '@common/map.types';
import { Test, TestingModule } from '@nestjs/testing';
import * as sinon from 'sinon';
import { stub } from 'sinon';
import { Socket } from 'socket.io';
import { GameCreationService } from './game-creation.service';

const SMALL_MAP_SIZE = 10;
const MEDIUM_MAP_SIZE = 15;
const LARGE_MAP_SIZE = 20;
const SMALL_MAP_PLAYERS_MIN_MAX = 2;
const MEDIUM_MAP_PLAYERS_MIN = 2;
const MEDIUM_MAP_PLAYERS_MAX = 4;
const LARGE_MAP_PLAYERS_MIN = 2;
const LARGE_MAP_PLAYERS_MAX = 6;

describe('GameCreationService', () => {
    let service: GameCreationService;
    let player: Player;
    let specs: Specs;
    let gameRoom: Game;

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
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
            nEvasions: 0,
            nLifeTaken: 0,
            nLifeLost: 0,
        };

        player = {
            socketId: 'player-1',
            name: 'Player 1',
            avatar: Avatar.Avatar1,
            isActive: true,
            position: { x: 0, y: 0 },
            specs,
            inventory: [],
            turn: 0,
        };

        gameRoom = {
            connections: ['host-id'],
            hasStarted: false,
            id: 'room-1',
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
            currentTurn: 0,
            nDoorsManipulated: 0,
            visitedTiles: [],
            duration: 0,
            nTurns: 0,
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

    it('should return the correct game with getGame', () => {
        service.addGame(gameRoom);
        const game = service.getGame('room-1');
        expect(game).toEqual(gameRoom);
    });

    it('should return all games with getGames', () => {
        service.addGame(gameRoom);
        const games = service.getGames();
        expect(games).toEqual([gameRoom]);
    });

    it('should mark a player as inactive on disconnect if the game has started', () => {
        const player = { socketId: 'player-1', isActive: true } as Player;
        gameRoom.players.push(player);
        service.addGame(gameRoom);

        const mockSocket = sinon.createStubInstance(Socket);
        (mockSocket as any).id = 'player-1';
        stub(mockSocket, 'rooms').value(new Set(['room-1']));

        gameRoom.hasStarted = true;

        service.handlePlayerDisconnect(mockSocket as unknown as Socket, gameRoom.id);

        expect(service['gameRooms']['room-1'].players[0].isActive).toBe(false);
    });

    it('should remove a player on disconnect if the game has not started', () => {
        const player = { socketId: 'player-1', isActive: true } as Player;
        gameRoom.players.push(player);
        service.addGame(gameRoom);

        const mockSocket = sinon.createStubInstance(Socket);
        (mockSocket as any).id = 'player-1';
        stub(mockSocket, 'rooms').value(new Set(['room-1']));

        gameRoom.hasStarted = false;

        service.handlePlayerDisconnect(mockSocket as unknown as Socket, gameRoom.id);
        expect(service['gameRooms']['room-1'].players.some((p) => p.socketId === 'player-1')).toBe(false);
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

    it('should return true if socketId is host in isPlayerHost', () => {
        service.addGame(gameRoom);
        const result = service.isPlayerHost('host-id', 'room-1');
        expect(result).toBe(true);
    });

    it('should initialize the game by setting random order for equal speeds and starting points', () => {
        gameRoom.players = [
            { ...player, name: 'Player 1', specs: { ...player.specs, speed: 5 } },
            { ...player, socketId: 'player-2', name: 'Player 2', specs: { ...player.specs, speed: 10 } },
            { ...player, socketId: 'player-3', name: 'Player 3', specs: { ...player.specs, speed: 5 } },
        ];
        gameRoom.startTiles = [{ coordinate: { x: 1, y: 1 } }, { coordinate: { x: 2, y: 2 } }, { coordinate: { x: 3, y: 3 } }];
        service.addGame(gameRoom);

        const setOrderSpy = jest.spyOn(service, 'setOrder');
        const setStartingPointsSpy = jest.spyOn(service, 'setStartingPoints');

        service.initializeGame('room-1');

        expect(setOrderSpy).toHaveBeenCalledWith('room-1');
        expect(setStartingPointsSpy).toHaveBeenCalledWith('room-1');

        const players = service['gameRooms']['room-1'].players;
        expect(players[0].name).toBe('Player 2');

        expect([players[1].name, players[2].name]).toEqual(expect.arrayContaining(['Player 1', 'Player 3']));
    });

    it('should remove tiles until the number of tiles matches the number of players and assign positions', () => {
        gameRoom.players = [{ ...player }, { ...player, socketId: 'player-2', name: 'Player 2' }];

        gameRoom.startTiles = [
            { coordinate: { x: 1, y: 1 } },
            { coordinate: { x: 2, y: 2 } },
            { coordinate: { x: 3, y: 3 } },
            { coordinate: { x: 4, y: 4 } },
        ];

        service.addGame(gameRoom);
        service.setStartingPoints('room-1');

        expect(service['gameRooms']['room-1'].startTiles.length).toBe(2);

        expect(service['gameRooms']['room-1'].players[0].position).toBeDefined();
        expect(service['gameRooms']['room-1'].players[1].position).toBeDefined();
    });

    it('should return true if the game exists in gameRooms', () => {
        service['gameRooms'] = { 'room-1': gameRoom };
        const result = service.doesGameExist('room-1');
        expect(result).toBe(true);
    });

    it('should return false if the game does not exist in gameRooms', () => {
        service['gameRooms'] = {};
        const result = service.doesGameExist('room-1');
        expect(result).toBe(false);
    });

    describe('isGameStartable', () => {
        it('should return true for a small map with the exact number of players', () => {
            gameRoom.mapSize = { x: SMALL_MAP_SIZE, y: SMALL_MAP_SIZE };
            gameRoom.players = new Array(SMALL_MAP_PLAYERS_MIN_MAX).fill(player);

            service.addGame(gameRoom);
            const result = service.isGameStartable(gameRoom.id);

            expect(result).toBe(true);
        });

        it('should return false for a small map with fewer than the required players', () => {
            gameRoom.mapSize = { x: SMALL_MAP_SIZE, y: SMALL_MAP_SIZE };
            gameRoom.players = new Array(SMALL_MAP_PLAYERS_MIN_MAX - 1).fill(player);

            service.addGame(gameRoom);
            const result = service.isGameStartable(gameRoom.id);

            expect(result).toBe(false);
        });

        it('should return true for a medium map with valid number of players', () => {
            gameRoom.mapSize = { x: MEDIUM_MAP_SIZE, y: MEDIUM_MAP_SIZE };
            gameRoom.players = new Array(MEDIUM_MAP_PLAYERS_MIN + 1).fill(player);

            service.addGame(gameRoom);
            const result = service.isGameStartable(gameRoom.id);

            expect(result).toBe(true);
        });

        it('should return false for a large map with fewer than the minimum number of players', () => {
            gameRoom.mapSize = { x: LARGE_MAP_SIZE, y: LARGE_MAP_SIZE };
            gameRoom.players = new Array(LARGE_MAP_PLAYERS_MIN - 1).fill(player);

            service.addGame(gameRoom);
            const result = service.isGameStartable(gameRoom.id);

            expect(result).toBe(false);
        });

        it('should return false for an unrecognized map size', () => {
            gameRoom.mapSize = { x: 999, y: 999 };
            gameRoom.players = new Array(5).fill(player);
    
            service.addGame(gameRoom);
            const result = service.isGameStartable(gameRoom.id);
    
            expect(result).toBe(false); 
        });
    });

    describe('isMaxPlayersReached', () => {
        it('should return true when max players are reached for a small map', () => {
            gameRoom.mapSize = { x: SMALL_MAP_SIZE, y: SMALL_MAP_SIZE };
            const connections = new Array(SMALL_MAP_PLAYERS_MIN_MAX).fill('connection-id');

            service.addGame(gameRoom);
            const result = service.isMaxPlayersReached(connections, gameRoom.id);

            expect(result).toBe(true);
        });

        it('should return false when there are fewer players than the max for a medium map', () => {
            gameRoom.mapSize = { x: MEDIUM_MAP_SIZE, y: MEDIUM_MAP_SIZE };
            const connections = new Array(MEDIUM_MAP_PLAYERS_MAX - 1).fill('connection-id');

            service.addGame(gameRoom);
            const result = service.isMaxPlayersReached(connections, gameRoom.id);

            expect(result).toBe(false);
        });

        it('should return false for a large map with fewer than the max number of players', () => {
            gameRoom.mapSize = { x: LARGE_MAP_SIZE, y: LARGE_MAP_SIZE };
            const connections = new Array(LARGE_MAP_PLAYERS_MAX - 1).fill('connection-id');

            service.addGame(gameRoom);
            const result = service.isMaxPlayersReached(connections, gameRoom.id);

            expect(result).toBe(false);
        });

        it('should return false for an unrecognized map size', () => {
            gameRoom.mapSize = { x: 999, y: 999 }; 
            const connections = new Array(5).fill('connection-id');
    
            service.addGame(gameRoom);
            const result = service.isMaxPlayersReached(connections, gameRoom.id);
    
            expect(result).toBe(false); 
        });
    });

    it('should lock the game', () => {
        service.addGame(gameRoom);
        service.lockGame(gameRoom.id);

        expect(service['gameRooms'][gameRoom.id].isLocked).toBe(true);
    });

    it('should delete the game room', () => {
        service.addGame(gameRoom);
        service.deleteRoom(gameRoom.id);

        expect(service['gameRooms'][gameRoom.id]).toBeUndefined();
    });
});
