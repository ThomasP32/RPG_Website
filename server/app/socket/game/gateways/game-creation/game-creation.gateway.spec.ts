import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { JournalService } from '@app/services/journal/journal.service';
import { ProfileType } from '@common/constants';
import { GameCreationEvents } from '@common/events/game-creation.events';
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
    let journalService: SinonStubbedInstance<JournalService>;

    let specs: Specs = {
        life: 100,
        speed: 10,
        attack: 15,
        defense: 5,
        attackBonus: Bonus.D4,
        defenseBonus: Bonus.D6,
        movePoints: 3,
        actions: 2,
        evasions: 2,
        nVictories: 0,
        nDefeats: 0,
        nCombats: 0,
        nEvasions: 0,
        nLifeTaken: 0,
        nLifeLost: 0,
        nItemsUsed: 0,
    };
    let player: Player = {
        socketId: 'player-1',
        name: 'Player 1',
        avatar: Avatar.Avatar1,
        isActive: true,
        position: { x: 0, y: 0 },
        initialPosition: { x: 0, y: 0 },
        specs,
        inventory: [],
        turn: 0,
        visitedTiles: [],
        profile: ProfileType.NORMAL,
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
            { coordinate: { x: 10, y: 10 }, category: ItemCategory.WallBreaker },
        ],
        doorTiles: [{ coordinate: { x: 15, y: 15 }, isOpened: false }],
        tiles: [
            { coordinate: { x: 0, y: 0 }, category: TileCategory.Wall },
            { coordinate: { x: 1, y: 1 }, category: TileCategory.Water },
        ],
        hostSocketId: 'host-id',
        players: [player],
        currentTurn: 0,
        nDoorsManipulated: [],
        duration: 0,
        nTurns: 0,
        debug: false,
        isLocked: false,
    };
    beforeEach(async () => {
        logger = createStubInstance(Logger);
        socket = createStubInstance<Socket>(Socket);
        gameCreationService = createStubInstance<GameCreationService>(GameCreationService);
        serverStub = createStubInstance<Server>(Server);
        journalService = createStubInstance<JournalService>(JournalService);
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
                { provide: JournalService, useValue: journalService },
            ],
        }).compile();
        gateway = module.get<GameGateway>(GameGateway);
        gateway['server'] = serverStub;
        const rooms = new Map();
        rooms.set('game-id', { size: 2 });

        const roomStub = {
            fetchSockets: stub().resolves([]),
            adapter: {},
            rooms: new Map(),
            exceptRooms: stub(),
            flags: {},
            emit: stub(),
        };

        serverStub.in.returns(roomStub as any);

        serverStub.to.returns({ emit: stub() } as any);
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
            expect(socket.emit.calledWith(GameCreationEvents.GameNotFound, 'Le code est invalide, veuillez réessayer.')).toBeTruthy();
        });

        it('should emit gameAccessed if the game exists and is not locked', () => {
            const gameId = 'game-id';
            const game: Game = { id: gameId, isLocked: false } as Game;
            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGameById.returns(game);
            gateway.handleAccessGame(socket, gameId);
            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(gameCreationService.getGameById.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith(GameCreationEvents.GameAccessed)).toBeTruthy();
        });
        it('should emit gameLocked if the game exists and is locked', () => {
            const gameId = 'game-id';
            const game: Game = { id: gameId, isLocked: true } as Game;
            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGameById.returns(game);
            gateway.handleAccessGame(socket, gameId);
            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(gameCreationService.getGameById.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith(GameCreationEvents.GameLocked, 'La partie est vérouillée, veuillez réessayer plus tard.')).toBeTruthy();
        });
        it('should emit gameNotFound if the game does not exist', () => {
            const gameId = 'game-id';
            gameCreationService.doesGameExist.returns(false);
            gateway.handleAccessGame(socket, gameId);
            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith(GameCreationEvents.GameNotFound, 'Le code est invalide, veuillez réessayer.')).toBeTruthy();
        });
        it('should emit gameLocked if the game has already started', () => {
            const gameId = 'game-id';
            const game: Game = { id: gameId, isLocked: false, hasStarted: true } as Game;

            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGameById.returns(game);

            gateway.handleAccessGame(socket, gameId);

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(gameCreationService.getGameById.calledWith(gameId)).toBeTruthy();
            expect(
                socket.emit.calledWith(GameCreationEvents.GameLocked, "Vous n'avez pas été assez rapide...\nLa partie a déjà commencé."),
            ).toBeTruthy();
        });
    });
    describe('handleCreateGame', () => {
        it('should start the game and call addGame on GameCreationService', () => {
            const newGame: Game = { id: '1234', hostSocketId: '', players: [] } as Game;
            gateway.handleCreateGame(socket, newGame);
            expect(socket.join.calledWith('1234')).toBeTruthy();
            expect(newGame.hostSocketId).toEqual(socket.id);
            expect(gameCreationService.addGame.calledWith(newGame)).toBeTruthy();
        });
    });
    describe('handleJoinGame', () => {
        it('should emit gameLocked when trying to join a locked game', () => {
            gameRoom.isLocked = true;

            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGameById.returns(gameRoom);

            gateway.handleJoinGame(socket, { player: player, gameId: gameRoom.id });

            expect(gameCreationService.doesGameExist.calledWith(gameRoom.id)).toBeTruthy();
            expect(gameCreationService.getGameById.calledWith(gameRoom.id)).toBeTruthy();
            expect(socket.emit.calledWith(GameCreationEvents.GameLocked, 'La partie est vérouillée, veuillez réessayer plus tard.')).toBeTruthy();
            expect(gameCreationService.addPlayerToGame.called).toBeFalsy();
            gameRoom.isLocked = false;
        });

        it('should lock the game when max players are reached', () => {
            const newPlayer: Player = { name: 'Player2', socketId: socket.id, isActive: true } as Player;
            const updatedGame: Game = { ...gameRoom, players: [...gameRoom.players, newPlayer] };

            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGameById.returns(gameRoom);
            gameCreationService.addPlayerToGame.returns(updatedGame);
            gameCreationService.isMaxPlayersReached.returns(true);

            gateway.handleJoinGame(socket, { player: newPlayer, gameId: gameRoom.id });

            expect(gameCreationService.doesGameExist.calledWith(gameRoom.id)).toBeTruthy();
            expect(gameCreationService.addPlayerToGame.calledWith(newPlayer, gameRoom.id)).toBeTruthy();
            expect(gameCreationService.lockGame.calledWith(gameRoom.id)).toBeTruthy();
            expect(socket.emit.calledWith(GameCreationEvents.YouJoined, newPlayer)).toBeTruthy();
        });

        it('should add player to game and call addPlayerToGame on GameCreationService', () => {
            const newPlayer: Player = { name: 'Player1', socketId: socket.id, isActive: true } as Player;
            const updatedGame: Game = { ...gameRoom, players: [...gameRoom.players, newPlayer] };

            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGameById.returns(gameRoom);
            gameCreationService.addPlayerToGame.returns(updatedGame);

            gateway.handleJoinGame(socket, { player: newPlayer, gameId: gameRoom.id });

            expect(gameCreationService.doesGameExist.calledWith(gameRoom.id)).toBeTruthy();
            expect(gameCreationService.getGameById.calledWith(gameRoom.id)).toBeTruthy();
            expect(gameCreationService.addPlayerToGame.calledWith(newPlayer, gameRoom.id)).toBeTruthy();
        });

        it('should not add player to game and call addPlayerToGame on GameCreationService when game does not exist', () => {
            gameCreationService.doesGameExist.returns(false);
            gateway.handleJoinGame(socket, { player: player, gameId: gameRoom.id });
            expect(socket.join.calledWith(gameRoom.id)).toBeFalsy();
            expect(socket.emit.calledWith(GameCreationEvents.GameNotFound)).toBeTruthy();
        });
    });

    describe('handleInitGame', () => {
        it('should initialize the game and emit gameInitialized if the game exists and the client is the host', () => {
            const roomId = 'room-1';
            gameRoom.hostSocketId = socket.id;
            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGameById.returns(gameRoom);

            gateway.handleInitGame(socket, roomId);

            expect(gameCreationService.initializeGame.calledWith(roomId)).toBeTruthy();
        });

        it('shouldnt initialize the game if the game doesnt exists', () => {
            const roomId = 'room-1';

            gameCreationService.getGameById.returns(undefined);

            gateway.handleInitGame(socket, roomId);

            expect(gameCreationService.initializeGame.calledWith(roomId)).toBeFalsy();
        });

        it('should emit gameStarted to sockets not in the game and make them leave the room', async () => {
            const roomId = 'room1';
            const hostSocketId = 'host-socket-id';

            const client = createStubInstance(Socket);
            Object.defineProperty(client, 'id', {
                value: hostSocketId,
                writable: false,
            });

            const game = {
                id: roomId,
                hostSocketId,
                players: [{ socketId: 'player-1' }],
            } as Game;

            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGameById.returns(game);

            const socketInGame = createStubInstance(Socket);
            const socketNotInGame = createStubInstance(Socket);

            Object.defineProperty(socketInGame, 'id', { value: 'player-1' });
            Object.defineProperty(socketNotInGame, 'id', { value: 'socket-not-in-game' });

            socketInGame.emit = stub();
            socketInGame.leave = stub();
            socketNotInGame.emit = stub();
            socketNotInGame.leave = stub();

            const fetchSocketsStub = stub().resolves([socketInGame, socketNotInGame]);
            serverStub.in.returns({ fetchSockets: fetchSocketsStub } as any);

            const emitStub = stub();
            serverStub.to.returns({ emit: emitStub } as any);

            await gateway.handleInitGame(client as unknown as Socket, roomId);

            expect(fetchSocketsStub.calledOnce).toBeTruthy();

            expect(
                socketNotInGame.emit.calledWith(
                    GameCreationEvents.GameAlreadyStarted,
                    "La partie a commencée. Vous serez redirigé à la page d'acceuil",
                ),
            ).toBeTruthy();
            expect(socketNotInGame.leave.calledWith(roomId)).toBeTruthy();

            expect(socketInGame.emit.called).toBeFalsy();
            expect(socketInGame.leave.called).toBeFalsy();

            expect(emitStub.calledWith(GameCreationEvents.GameInitialized, game)).toBeTruthy();
        });
    });

    describe('getCurrentPlayers', () => {
        it('should emit currentPlayers if the game exists', () => {
            const gameId = 'room-1';
            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGameById.returns(gameRoom);

            gateway.getAvailableAvatars(socket, gameId);

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(gameCreationService.getGameById.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith(GameCreationEvents.CurrentPlayers, gameRoom.players)).toBeTruthy();
        });

        it('should emit gameNotFound if the game does not exist', () => {
            const gameId = 'non-existent-room';
            gameCreationService.doesGameExist.returns(false);

            gateway.getAvailableAvatars(socket, gameId);

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith(GameCreationEvents.GameNotFound, 'La partie a été fermée')).toBeTruthy();
        });
    });

    describe('ifStartable', () => {
        it('should emit isStartable if the game can start', () => {
            const gameId = 'game-id';
            const game: Game = { id: gameId, hostSocketId: socket.id } as Game;

            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGameById.returns(game);
            gameCreationService.isGameStartable.returns(true);

            gateway.isStartable(socket, gameId);

            expect(gameCreationService.isGameStartable.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith(GameCreationEvents.IsStartable)).toBeTruthy();
        });
        it('should emit isStartable if the game can start', () => {
            const gameId = 'game-id';
            const game: Game = { id: gameId, hostSocketId: socket.id } as Game;

            gameCreationService.getGameById.returns(game);
            gameCreationService.isGameStartable.returns(false);

            gateway.isStartable(socket, gameId);

            expect(gameCreationService.isGameStartable.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith(GameCreationEvents.IsStartable)).toBeFalsy();
        });
        describe('getGame', () => {
            it('should emit currentGame if the game exists', () => {
                const gameId = 'room-1';
                gameCreationService.doesGameExist.returns(true);
                gameCreationService.getGameById.returns(gameRoom);

                gateway.getGame(socket, gameId);

                expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
                expect(gameCreationService.getGameById.calledWith(gameId)).toBeTruthy();
                expect(socket.emit.calledWith(GameCreationEvents.CurrentGame, gameRoom)).toBeTruthy();
            });

            it('should emit gameNotFound if the game does not exist', () => {
                const gameId = 'non-existent-room';
                gameCreationService.doesGameExist.returns(false);

                gateway.getGame(socket, gameId);

                expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
                expect(socket.emit.calledWith(GameCreationEvents.GameNotFound, 'La partie a été fermée')).toBeTruthy();
            });
        });

        describe('handleKickPlayer', () => {
            it('should emit playerKicked to the specified player', () => {
                const playerId = 'player-1';
                const gameId = 'room-1';
                gateway.handleKickPlayer(socket, { gameId, playerId });
                expect(serverStub.to.calledWith(playerId)).toBeTruthy();
                const emitStub = serverStub.to(playerId).emit as SinonStubbedInstance<Socket>['emit'];
                expect(emitStub.calledWith(GameCreationEvents.PlayerKicked)).toBeTruthy();
            });
        });
        it('handleToggleGameLockState', () => {
            const gameId = 'room-1';
            const isLocked: boolean = false;
            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGameById.returns(gameRoom);

            gateway.handleToggleGameLockState(socket, { gameId, isLocked });

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeFalsy();
            expect(gameCreationService.getGameById.calledWith(gameId)).toBeTruthy();
        });
        describe('HandlePlayerLeaving', () => {
            it('should emit playerLeft to the game room', () => {
                const gameId = 'non-existent-room';
                gameCreationService.getGameById.returns(gameRoom);

                gateway.handleLeaveGame(socket, gameId);
                expect(gameCreationService.handlePlayerLeaving.calledWith(socket, gameId)).toBeFalsy();
                expect(serverStub.to.calledWith(gameId)).toBeFalsy();
                const emitStub = serverStub.to(gameId).emit as SinonStubbedInstance<Socket>['emit'];
                expect(emitStub.calledWith(GameCreationEvents.PlayerLeft, { player: player })).toBeFalsy();
            });
        });
        describe('handleKickPlayer', () => {
            it('should remove virtual player from the game and emit playerLeft', () => {
                const gameId = 'room-1';
                const playerId = 'virtualPlayer-1000';

                gameCreationService.getGameById.returns(gameRoom);
                gameCreationService.isMaxPlayersReached.returns(false);

                gateway.handleKickPlayer(socket, { gameId, playerId });

                expect(gameCreationService.getGameById.calledWith(gameId)).toBeTruthy();
                expect(gameRoom.players.length).toBe(1);
                expect(gameRoom.isLocked).toBe(false);
                expect(serverStub.to.calledWith(gameId)).toBeTruthy();
                const emitStub = serverStub.to(gameId).emit as SinonStubbedInstance<Socket>['emit'];
                expect(emitStub.calledWith(GameCreationEvents.PlayerLeft, gameRoom.players)).toBeTruthy();
            });

            it('should emit playerKicked to the specified player', () => {
                const gameId = 'room-1';
                const playerId = 'player-1';

                gateway.handleKickPlayer(socket, { gameId, playerId });

                expect(serverStub.to.calledWith(playerId)).toBeTruthy();
                const emitStub = serverStub.to(playerId).emit as SinonStubbedInstance<Socket>['emit'];
                expect(emitStub.calledWith(GameCreationEvents.PlayerKicked)).toBeTruthy();
            });
        });
    });
});
