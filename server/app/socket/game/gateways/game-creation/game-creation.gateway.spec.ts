import { GameCreationService } from '@app/socket/game/service/game-creation/game-creation.service';
import { Avatar, Bonus, Game, Player, Specs } from '@common/game';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { GameGateway } from './game-creation.gateway';
describe('GameGateway', () => {
    let gateway: GameGateway;
    let logger: SinonStubbedInstance<Logger>;
    let socket: SinonStubbedInstance<Socket>;
    let gameCreationService: SinonStubbedInstance<GameCreationService>;
    let serverStub: SinonStubbedInstance<Server>;
    let specs: Specs = {
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
    let player: Player = {
        socketId: 'player-1',
        name: 'Player 1',
        avatar: Avatar.Avatar1,
        isActive: true,
        position: { x: 0, y: 0 },
        specs,
        inventory: [],
        turn: 0,
    };
    let gameRoom: Game = {
        hasStarted: false,
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
        players: [player],
        currentTurn: 0,
        nDoorsManipulated: 0,
        visitedTiles: [],
        duration: 0,
        nTurns: 0,
        debug: false,
        isLocked: false,
        connections: [],
    };
    beforeEach(async () => {
        logger = createStubInstance(Logger);
        socket = createStubInstance<Socket>(Socket);
        gameCreationService = createStubInstance<GameCreationService>(GameCreationService);
        serverStub = createStubInstance<Server>(Server);
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameGateway,
                {
                    provide: Logger,
                    useValue: logger,
                },
                {
                    provide: GameCreationService,
                    useValue: gameCreationService,
                },
            ],
        }).compile();
        gateway = module.get<GameGateway>(GameGateway);
        gateway['server'] = serverStub;
        const rooms = new Map();
        rooms.set('game-id', { size: 2 });

        const adapterStub = {
            rooms: rooms,
        };

        Object.defineProperty(serverStub, 'sockets', {
            get: () => ({
                adapter: adapterStub,
            }),
        });
        serverStub.to.returns({
            emit: stub(),
        } as any);
    });
    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
    describe('handleAccessGame', () => {
        it('should emit gameNotFound if the game does not exist', () => {
            const gameId = 'game-id';

            gameCreationService.doesGameExist.returns(false);

            gateway.handleAccessGame(socket, gameId);

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith('gameNotFound', { reason: 'Le code est invalide, veuillez réessayer.' })).toBeTruthy();
        });

        it('should emit gameAccessed if the game exists and is not locked', () => {
            const gameId = 'game-id';
            const game: Game = { id: gameId, isLocked: false, connections: [] } as Game;
            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGame.returns(game);
            gateway.handleAccessGame(socket, gameId);
            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(gameCreationService.getGame.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith('gameAccessed')).toBeTruthy();
        });
        it('should emit gameLocked if the game exists and is locked', () => {
            const gameId = 'game-id';
            const game: Game = { id: gameId, isLocked: true } as Game;
            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGame.returns(game);
            gateway.handleAccessGame(socket, gameId);
            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(gameCreationService.getGame.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith('gameLocked', { reason: 'La partie est vérouillée, veuillez réessayer plus tard.' })).toBeTruthy();
        });
        it('should emit gameNotFound if the game does not exist', () => {
            const gameId = 'game-id';
            gameCreationService.doesGameExist.returns(false);
            gateway.handleAccessGame(socket, gameId);
            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith('gameNotFound', { reason: 'Le code est invalide, veuillez réessayer.' })).toBeTruthy();
        });
        it('should emit gameLocked if max players are reached', () => {
            const gameId = 'game-id';
            const game: Game = { id: gameId, isLocked: false, hasStarted: false } as Game;

            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGame.returns(game);
            gameCreationService.isMaxPlayersReached.returns(true);

            gateway.handleAccessGame(socket, gameId);

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(gameCreationService.getGame.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith('gameLocked', { reason: "Vous n'avez pas été assez rapide...\nLa salle d'attente de la partie est déjà pleine." })).toBeTruthy();
        });
        it('should emit gameLocked if the game has already started', () => {
            const gameId = 'game-id';
            const game: Game = { id: gameId, isLocked: false, hasStarted: true } as Game;

            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGame.returns(game);

            gateway.handleAccessGame(socket, gameId);

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(gameCreationService.getGame.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith('gameLocked', { reason: "Vous n'avez pas été assez rapide...\nLa partie a déjà commencé." })).toBeTruthy();
        });
    });
    describe('handleStartGame', () => {
        it('should start the game and call addGame on GameCreationService', () => {
            const newGame: Game = { id: '1234', hostSocketId: '', players: [] } as Game;
            gateway.handleStartGame(socket, newGame);
            expect(socket.join.calledWith('1234')).toBeTruthy();
            expect(newGame.hostSocketId).toEqual(socket.id);
            expect(gameCreationService.addGame.calledWith(newGame)).toBeTruthy();
        });
    });
    describe('handleJoinGame', () => {
        it('should emit gameLocked when trying to join a locked game', () => {
            gameRoom.isLocked = true;

            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGame.returns(gameRoom);

            gateway.handleJoinGame(socket, { player: player, gameId: gameRoom.id });

            expect(gameCreationService.doesGameExist.calledWith(gameRoom.id)).toBeTruthy();
            expect(gameCreationService.getGame.calledWith(gameRoom.id)).toBeTruthy();
            expect(socket.emit.calledWith('gameLocked', { reason: 'La partie est vérouillée, veuillez réessayer plus tard.' })).toBeTruthy();
            expect(gameCreationService.addPlayerToGame.called).toBeFalsy();
            gameRoom.isLocked = false;
        });

        it('should add player to game and call addPlayerToGame on GameCreationService', () => {
            const newPlayer: Player = { name: 'Player1', socketId: 'socket-id', isActive: true } as Player;
            const updatedGame: Game = { ...gameRoom, players: [...gameRoom.players, newPlayer] };

            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGame.returns(gameRoom);
            gameCreationService.addPlayerToGame.returns(updatedGame);

            gateway.handleJoinGame(socket, { player: newPlayer, gameId: gameRoom.id });

            expect(gameCreationService.doesGameExist.calledWith(gameRoom.id)).toBeTruthy();
            expect(gameCreationService.getGame.calledWith(gameRoom.id)).toBeTruthy();
            expect(gameCreationService.addPlayerToGame.calledWith(newPlayer, gameRoom.id)).toBeTruthy();
        });

        it('should not add player to game and call addPlayerToGame on GameCreationService when game does not exist', () => {
            gameCreationService.doesGameExist.returns(false);
            gateway.handleJoinGame(socket, { player: player, gameId: gameRoom.id });
            expect(socket.join.calledWith(gameRoom.id)).toBeFalsy();
            expect(socket.emit.calledWith('gameNotFound')).toBeTruthy();
        });
    });

    describe('handleDisconnect', () => {
        it('should call deleteRoom when the player is the host', () => {
            stub(socket, 'rooms').value(new Set([gameRoom.id, 'client-id']));
            gameCreationService.getGames.returns([gameRoom]);
            gameCreationService.isPlayerHost.returns(true);

            gateway.handleDisconnect(socket);

            expect(gameCreationService.isPlayerHost.calledWith(socket.id, gameRoom.id)).toBeTruthy();
            expect(gameCreationService.deleteRoom.calledWith(gameRoom.id)).toBeTruthy();
        });

        it('should call handlePlayerDisconnect when the player is not the host', () => {
            const gameId = 'game-id';
            gameRoom.connections = [socket.id];
            const updatedGame: Game = { id: gameId, players: [] } as Game;
            stub(socket, 'rooms').value(new Set([gameId, 'client-id']));
            gameCreationService.getGames.returns([gameRoom]);
            gameCreationService.isPlayerHost.returns(false);
            gameCreationService.handlePlayerDisconnect.returns(updatedGame);

            gateway.handleDisconnect(socket);

            expect(gameCreationService.isPlayerHost.calledWith(socket.id, gameRoom.id)).toBeTruthy();
            expect(gameCreationService.handlePlayerDisconnect.calledWith(socket)).toBeTruthy();
        });
    });

    describe('handleInitGame', () => {
        it('should initialize the game and emit gameInitialized if the game exists and the client is the host', () => {
            const roomId = 'room-1';
            gameRoom.hostSocketId = socket.id;
            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGame.returns(gameRoom);

            gateway.handleInitGame(socket, roomId);

            expect(gameCreationService.initializeGame.calledWith(roomId)).toBeTruthy();
        });

        it('shouldnt initialize the game if the game doesnt exists', () => {
            const roomId = 'room-1';

            gameCreationService.getGame.returns(undefined);

            gateway.handleInitGame(socket, roomId);

            expect(gameCreationService.initializeGame.calledWith(roomId)).toBeFalsy();
        });
    });

    describe('getCurrentPlayers', () => {
        it('should emit currentPlayers if the game exists', () => {
            const gameId = 'room-1';
            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGame.returns(gameRoom);

            gateway.getAvailableAvatars(socket, gameId);

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(gameCreationService.getGame.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith('currentPlayers', gameRoom.players)).toBeTruthy();
        });

        it('should emit gameNotFound if the game does not exist', () => {
            const gameId = 'non-existent-room';
            gameCreationService.doesGameExist.returns(false);

            gateway.getAvailableAvatars(socket, gameId);

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith('gameNotFound', { reason: 'La partie a été fermée' })).toBeTruthy();
        });
    });

    describe('ifStartable', () => {
        it('should emit isStartable if the game can start', () => {
            const gameId = 'game-id';
            const game: Game = { id: gameId, hostSocketId: socket.id } as Game;

            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGame.returns(game);
            gameCreationService.isGameStartable.returns(true);

            gateway.isStartable(socket, gameId);

            expect(gameCreationService.isGameStartable.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith('isStartable', { game: game })).toBeTruthy();
        });
        it('should emit isStartable if the game can start', () => {
            const gameId = 'game-id';
            const game: Game = { id: gameId, hostSocketId: socket.id } as Game;

            gameCreationService.getGame.returns(game);
            gameCreationService.isGameStartable.returns(false);

            gateway.isStartable(socket, gameId);

            expect(gameCreationService.isGameStartable.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith('isStartable', { game: game })).toBeFalsy();
        });
    });
});
