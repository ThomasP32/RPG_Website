import { GameCreationService } from '@app/socket/game/service/game-creation/game-creation.service';
import { GameManagerService } from '@app/socket/game/service/game-manager/game-manager.service';
import { Avatar, Bonus, Game, Player, Specs } from '@common/game';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonFakeTimers, SinonStub, SinonStubbedInstance, createStubInstance, stub, useFakeTimers } from 'sinon';
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
        visitedTiles: [],
    };

    let gameRoom: Game = {
        hasStarted: true,
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
        const emitStub = stub();
        serverStub.to.returns({ emit: emitStub } as any);

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
        let clock: SinonFakeTimers;

        beforeEach(() => {
            clock = useFakeTimers();
        });

        afterEach(() => {
            clock.restore();
        });

        it('should emit gameNotFound if the game does not exist', () => {
            const gameId = 'game-1';
            const position = { x: 1, y: 2 };
            gameCreationService.doesGameExist.returns(false);

            gateway.getMove(socket, { playerName: 'Player1', gameId, destination: position });

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(socket.emit.calledWith('gameNotFound')).toBeTruthy();
            expect(gameManagerService.getMove.called).toBeFalsy();
        });

        it('should emit nothing if destination is invalid', () => {
            const gameId = 'game-1';
            const position = { x: 1, y: 2 };
            gameCreationService.doesGameExist.returns(true);
            gameManagerService.getMove.returns([]);

            gateway.getMove(socket, { playerName: 'Player1', gameId, destination: position });

            expect(gameCreationService.doesGameExist.calledWith(gameId)).toBeTruthy();
            expect(gameManagerService.getMove.calledWith(gameId, 'Player1', position, false)).toBeTruthy();
            expect(socket.emit.calledWith('positionUpdated')).toBeFalsy();
        });

        it('should emit playerMoved and playerFinishedMoving if moves are returned', () => {
            const position = { x: 1, y: 2 };
            const mockMoves = [
                { x: 1, y: 2 },
                { x: 2, y: 3 },
            ];

            const emitStub = serverStub.to(gameRoom.id).emit as SinonStub;

            gameCreationService.doesGameExist.returns(true);
            gameCreationService.getGame.returns(gameRoom);
            gameManagerService.getMove.returns(mockMoves);

            gateway.getMove(socket, { playerName: gameRoom.players[0].name, gameId: gameRoom.id, destination: position });

            expect(gameManagerService.updatePosition.calledWith(gameRoom.id, gameRoom.players[0].name, position)).toBeTruthy();
            clock.tick(2000);
            expect(emitStub.calledWith('positionUpdated', { playerName: gameRoom.players[0].name, position })).toBeTruthy();
            expect(emitStub.calledWith('playerFinishedMoving', { game: gameRoom })).toBeTruthy();
        });
    });

    describe('isGameFinished', () => {
        it('should emit gameFinishedNoWin if only one player is left and the game has started', () => {
            const gameId = gameRoom.id;
            const emitStub = serverStub.to(gameRoom.id).emit as SinonStub;

            const modifiedGameRoom = { ...gameRoom, players: [player], hasStarted: true };
            gameCreationService.getGame.returns(modifiedGameRoom);

            gateway.isGameFinished(gameId);

            expect(emitStub.calledWith('gameFinishedNoWin', { winner: player })).toBeTruthy();
        });

        it('should not emit gameFinishedNoWin if the game has not started', () => {
            const gameId = gameRoom.id;
            const emitStub = serverStub.to(gameRoom.id).emit as SinonStub;

            const modifiedGameRoom = { ...gameRoom, players: [player], hasStarted: false };
            gameCreationService.getGame.returns(modifiedGameRoom);

            gateway.isGameFinished(gameId);

            expect(emitStub.calledWith('gameFinishedNoWin')).toBeFalsy();
        });

        it('should not emit gameFinishedNoWin if more than one player remains', () => {
            const gameId = gameRoom.id;
            const emitStub = serverStub.to(gameRoom.id).emit as SinonStub;

            const modifiedGameRoom = { ...gameRoom, players: [player, { ...player, socketId: 'player-2', name: 'Player 2' }], hasStarted: true };
            gameCreationService.getGame.returns(modifiedGameRoom);

            gateway.isGameFinished(gameId);

            expect(emitStub.calledWith('gameFinishedNoWin')).toBeFalsy();
        });
    });

    describe('isGameFinished', () => {
        it('should emit gameFinishedNoWin if only one player is left and the game has started', () => {
            const gameId = gameRoom.id;
            const emitStub = serverStub.to(gameRoom.id).emit as SinonStub;

            const modifiedGameRoom = { ...gameRoom, players: [player], hasStarted: true };
            gameCreationService.getGame.returns(modifiedGameRoom);

            gateway.isGameFinished(gameId);

            expect(emitStub.calledWith('gameFinishedNoWin', { winner: player })).toBeTruthy();
        });

        it('should not emit gameFinishedNoWin if the game has not started', () => {
            const gameId = gameRoom.id;
            const emitStub = serverStub.to(gameRoom.id).emit as SinonStub;

            const modifiedGameRoom = { ...gameRoom, players: [player], hasStarted: false };
            gameCreationService.getGame.returns(modifiedGameRoom);

            gateway.isGameFinished(gameId);

            expect(emitStub.calledWith('gameFinishedNoWin')).toBeFalsy();
        });

        it('should not emit gameFinishedNoWin if more than one player remains', () => {
            const gameId = gameRoom.id;
            const emitStub = serverStub.to(gameRoom.id).emit as SinonStub;

            const modifiedGameRoom = { ...gameRoom, players: [player, { ...player, socketId: 'player-2', name: 'Player 2' }], hasStarted: true };
            gameCreationService.getGame.returns(modifiedGameRoom);

            gateway.isGameFinished(gameId);

            expect(emitStub.calledWith('gameFinishedNoWin')).toBeFalsy();
        });
    });

    describe('hasPlayerWon', () => {
        it('should emit playerWon if a player has 3 or more victories', () => {
            const gameId = gameRoom.id;
            const emitStub = serverStub.to(gameRoom.id).emit as SinonStub;

            const winningPlayer = { ...player, specs: { ...player.specs, nVictories: 3 } };
            const modifiedGameRoom = { ...gameRoom, players: [winningPlayer] };
            gameCreationService.getGame.returns(modifiedGameRoom);

            gateway.hasPlayerWon(gameId);

            expect(emitStub.calledWith('playerWon', { winner: winningPlayer })).toBeTruthy();
        });

        it('should not emit playerWon if no player has 3 victories', () => {
            const gameId = gameRoom.id;
            const emitStub = serverStub.to(gameRoom.id).emit as SinonStub;

            const losingPlayer = { ...player, specs: { ...player.specs, nVictories: 2 } };
            const modifiedGameRoom = { ...gameRoom, players: [losingPlayer] };
            gameCreationService.getGame.returns(modifiedGameRoom);

            gateway.hasPlayerWon(gameId);

            expect(emitStub.calledWith('playerWon')).toBeFalsy();
        });

        it('should emit playerWon only for the player with 3 or more victories', () => {
            const gameId = gameRoom.id;
            const emitStub = serverStub.to(gameRoom.id).emit as SinonStub;

            const winningPlayer = { ...player, specs: { ...player.specs, nVictories: 3 } };
            const losingPlayer = { ...player, socketId: 'player-2', name: 'Player 2', specs: { ...player.specs, nVictories: 2 } };
            const modifiedGameRoom = { ...gameRoom, players: [winningPlayer, losingPlayer] };
            gameCreationService.getGame.returns(modifiedGameRoom);

            gateway.hasPlayerWon(gameId);

            expect(emitStub.calledWith('playerWon', { winner: winningPlayer })).toBeTruthy();
            expect(emitStub.calledWith('playerWon', { winner: losingPlayer })).toBeFalsy();
        });
    });

    describe('startTurn', () => {
        it('should increase player attack and defense if on ice tile and emit yourTurn', () => {
            const gameId = gameRoom.id;
            const emitStub = serverStub.to(player.socketId).emit as SinonStub;

            const playerOnIce = { ...player, position: { x: 1, y: 1 }, specs: { ...player.specs, attack: 10, defense: 5 }, turn: 0 };
            const modifiedGameRoom = {
                ...gameRoom,
                players: [playerOnIce],
                currentTurn: 0,
                tiles: [{ coordinate: { x: 1, y: 1 }, category: TileCategory.Ice }],
            };
            gameCreationService.getGame.returns(modifiedGameRoom);
            gameCreationService.doesGameExist.returns(true);

            gateway.startTurn(socket, gameId);

            expect(playerOnIce.specs.attack).toBe(12);
            expect(playerOnIce.specs.defense).toBe(7);
            expect(emitStub.calledWith('yourTurn')).toBeTruthy();
        });

        it('should not change player stats if not on ice tile and emit yourTurn', () => {
            const gameId = 'room-1';
            const emitStub = serverStub.to(player.socketId).emit as SinonStub;

            const playerNotOnIce = { ...player, position: { x: 2, y: 2 }, specs: { ...player.specs, attack: 10, defense: 5 }, turn: 0 };
            const modifiedGameRoom = {
                ...gameRoom,
                players: [playerNotOnIce],
                currentTurn: 0,
                tiles: [{ coordinate: { x: 1, y: 1 }, category: TileCategory.Ice }],
            };
            gameCreationService.getGame.returns(modifiedGameRoom);
            gameCreationService.doesGameExist.returns(true);

            gateway.startTurn(socket, gameId);

            expect(playerNotOnIce.specs.attack).toBe(10);
            expect(playerNotOnIce.specs.defense).toBe(5);
            expect(emitStub.calledWith('yourTurn')).toBeTruthy();
        });

        it('should emit playerFinishedTurn if the current player is inactive', () => {
            const gameId = gameRoom.id;
            const emitStub = serverStub.to(gameRoom.hostSocketId).emit as SinonStub;

            const inactivePlayer = { ...player, isActive: false, turn: 0 };
            const modifiedGameRoom = { ...gameRoom, players: [inactivePlayer], currentTurn: 0 };
            gameCreationService.getGame.returns(modifiedGameRoom);
            gameCreationService.doesGameExist.returns(true);

            gateway.startTurn(socket, gameId);

            expect(emitStub.calledWith('playerFinishedTurn', { game: modifiedGameRoom })).toBeTruthy();
        });
    });

    describe('endTurn', () => {
        it('should reduce player attack and defense if on ice tile and emit playerFinishedTurn', () => {
            const gameId = gameRoom.id;
            const emitStub = serverStub.to(gameRoom.hostSocketId).emit as SinonStub;

            const playerOnIce = { ...player, position: { x: 1, y: 1 }, specs: { ...player.specs, attack: 15, defense: 10 }, turn: 0 };
            const modifiedGameRoom = {
                ...gameRoom,
                players: [playerOnIce],
                tiles: [{ coordinate: { x: 1, y: 1 }, category: TileCategory.Ice }],
            };
            gameCreationService.getGame.returns(modifiedGameRoom);
            gameCreationService.doesGameExist.returns(true);

            gateway.endTurn(socket, gameId);

            expect(playerOnIce.specs.attack).toBe(13);
            expect(playerOnIce.specs.defense).toBe(8);
            expect(emitStub.calledWith('playerFinishedTurn', { game: modifiedGameRoom })).toBeTruthy();
        });

        it('should not change player stats if not on ice tile and emit playerFinishedTurn', () => {
            const gameId = 'room-1';
            const emitStub = serverStub.to(gameRoom.hostSocketId).emit as SinonStub;

            const playerNotOnIce = { ...player, position: { x: 2, y: 2 }, specs: { ...player.specs, attack: 15, defense: 10 }, turn: 0 };
            const modifiedGameRoom = {
                ...gameRoom,
                players: [playerNotOnIce],
                tiles: [{ coordinate: { x: 1, y: 1 }, category: TileCategory.Ice }],
            };
            gameCreationService.getGame.returns(modifiedGameRoom);
            gameCreationService.doesGameExist.returns(true);

            gateway.endTurn(socket, gameId);

            expect(playerNotOnIce.specs.attack).toBe(15);
            expect(playerNotOnIce.specs.defense).toBe(10);
            expect(emitStub.calledWith('playerFinishedTurn', { game: modifiedGameRoom })).toBeTruthy();
        });

        it('should emit playerFinishedTurn if the player is inactive', () => {
            const gameId = gameRoom.id;
            const emitStub = serverStub.to(gameRoom.hostSocketId).emit as SinonStub;

            const inactivePlayer = { ...player, isActive: false, turn: 0 };
            const modifiedGameRoom = { ...gameRoom, players: [inactivePlayer], currentTurn: 0 };
            gameCreationService.getGame.returns(modifiedGameRoom);
            gameCreationService.doesGameExist.returns(true);

            gateway.endTurn(socket, gameId);

            expect(emitStub.calledWith('playerFinishedTurn', { game: modifiedGameRoom })).toBeTruthy();
        });
    });
});
