import { Avatar, Bonus, Game, Player, Specs } from '@common/game';
import { Coordinate, ItemCategory, Mode, TileCategory } from '@common/map.types';
import { Test, TestingModule } from '@nestjs/testing';
import * as sinon from 'sinon';
import { stub } from 'sinon';
import { Socket } from 'socket.io';
import { GameCreationService } from './game-creation.service';

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
            availableAvatars: [Avatar.Avatar1, Avatar.Avatar2],
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
        gameRoom.startTiles = [
            { coordinate: { x: 1, y: 1 } },
            { coordinate: { x: 2, y: 2 } },
            { coordinate: { x: 3, y: 3 } }
        ];
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
        gameRoom.players = [
            { ...player },
            { ...player, socketId: 'player-2', name: 'Player 2' },
        ];
    
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
});
