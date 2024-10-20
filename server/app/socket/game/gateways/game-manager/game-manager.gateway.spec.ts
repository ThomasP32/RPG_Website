import { GameCreationService } from '@app/socket/game/service/game-creation/game-creation.service';
import { GameManagerService } from '@app/socket/game/service/game-manager/game-manager.service';
import { Avatar, Bonus, Game, Player, Specs } from '@common/game';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStub, SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { GameManagerGateway } from './game-manager.gateway';

describe('GameManagerGateway', () => {
    let gateway: GameManagerGateway;
    let gameCreationService: SinonStubbedInstance<GameCreationService>;
    let gameManagerService: SinonStubbedInstance<GameManagerService>;
    let socket: SinonStubbedInstance<Socket>;
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
        availableAvatars: [Avatar.Avatar1, Avatar.Avatar2],
        currentTurn: 0,
        nDoorsManipulated: 0,
        visitedTiles: [],
        duration: 0,
        nTurns: 0,
        debug: false,
        isLocked: false,
    };

    beforeEach(async () => {
        gameCreationService = createStubInstance(GameCreationService);
        gameManagerService = createStubInstance(GameManagerService);
        socket = createStubInstance<Socket>(Socket);
        socket.emit = stub();
        serverStub = createStubInstance<Server>(Server);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameManagerGateway,
                { provide: GameCreationService, useValue: gameCreationService },
                { provide: GameManagerService, useValue: gameManagerService },
            ],
        }).compile();

        gateway = module.get<GameManagerGateway>(GameManagerGateway);

        gateway['server'] = serverStub;
        serverStub.to.returns({ emit: stub() } as any);

        gameCreationService.doesGameExist.returns(true);
        gameCreationService.getGame.returns(gameRoom);
        gameManagerService.getMove.returns([{ x: 19, y: 19 }]);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('getMoves', () => {
        it('should emit gameNotFound if the game does not exist', () => {
            const gameId = 'game-1';
            gameCreationService.doesGameExist.returns(false);

            gateway.getMoves(socket, { playerName: 'Player1', gameId });

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith('gameNotFound')).toBeTruthy();
            expect(gameManagerService.getMoves.called).toBeFalsy();
        });

        it('should emit playerPossibleMoves if the game exists', () => {
            const gameId = 'game-1';
            const mockMoves = [{ x: 1, y: 2 }];
            gameCreationService.doesGameExist.returns(true);
            gameManagerService.getMoves.returns(mockMoves);

            gateway.getMoves(socket, { playerName: 'Player1', gameId });

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(gameManagerService.getMoves.calledWith(gameId, 'Player1')).toBeTruthy();
            expect(socket.emit.calledWith('playerPossibleMoves', { moves: mockMoves })).toBeTruthy();
        });
    });

    describe('getPreviewMove', () => {
        it('should emit gameNotFound if the game does not exist', () => {
            const gameId = 'game-1';
            const position = { x: 1, y: 2 };
            gameCreationService.doesGameExist.returns(false);

            gateway.getPreviewMove(socket, { playerName: 'Player1', gameId, position });

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith('gameNotFound')).toBeTruthy();
            expect(gameManagerService.getMove.called).toBeFalsy();
        });

        it('should emit playerPossibleMove if the game exists', () => {
            const gameId = 'game-1';
            const position = { x: 1, y: 2 };
            const mockMoves = [{ x: 1, y: 2 }];

            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGame.returns(gameRoom);
            gameManagerService.getMove.returns(mockMoves);

            gateway.getPreviewMove(socket, { playerName: 'Player1', gameId, position });

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(gameCreationService.getGame.calledWith(gameId)).toBeTruthy();
            expect(gameManagerService.getMove.calledWith(gameId, 'Player1', position, true)).toBeTruthy();
            expect(socket.emit.calledWith('playerPossibleMove', { moves: mockMoves })).toBeTruthy();
        });
    });

    describe('moveToPosition', () => {
        it('should emit gameNotFound if the game does not exist', () => {
            const gameId = 'game-1';
            const position = { x: 1, y: 2 };
            gameCreationService.doesGameExist.returns(false);

            gateway.getMove(socket, { playerName: 'Player1', gameId, position });

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith('gameNotFound')).toBeTruthy();
            expect(gameManagerService.getMove.called).toBeFalsy();
        });

        it('should emit tileUnreachable if no moves are returned', () => {
            const gameId = 'game-1';
            const position = { x: 1, y: 2 };
            gameCreationService.doesGameExist.returns(true);
            gameManagerService.getMove.returns([]);

            gateway.getMove(socket, { playerName: 'Player1', gameId, position });

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(gameManagerService.getMove.calledWith(gameId, 'Player1', position, false)).toBeTruthy();
            expect(socket.emit.calledWith('tileUnreachable')).toBeTruthy();
        });

        it('should emit playerMoved and playerFinishedMoving if moves are returned', () => {
            const gameId = 'game-1';
            const position = { x: 1, y: 2 };
            const mockMoves = [
                { x: 1, y: 2 },
                { x: 2, y: 3 },
            ];
            gameCreationService.doesGameExist.returns(true);
            gameManagerService.getMove.returns(mockMoves);

            gateway.getMove(socket, { playerName: 'Player1', gameId, position });

            expect(gameManagerService.updatePosition.calledWith(gameId, 'Player1', position)).toBeTruthy();
            const emitStub = serverStub.to(gameId).emit as SinonStub;
            expect(emitStub.calledWith('playerMoved', { playerName: 'Player1', position })).toBeTruthy();
            expect(emitStub.calledWith('playerFinishedMoving', { finalPosition: { x: 2, y: 3 } })).toBeTruthy();
        });
    });
});
