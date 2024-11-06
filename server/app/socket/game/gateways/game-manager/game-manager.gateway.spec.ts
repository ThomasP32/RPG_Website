import { GameCountdownService } from '@app/socket/game/service/countdown/game/game-countdown.service';
import { GameCreationService } from '@app/socket/game/service/game-creation/game-creation.service';
import { GameManagerService } from '@app/socket/game/service/game-manager/game-manager.service';
import { JournalService } from '@app/socket/game/service/journal/journal.service';
import { Game, Player, Specs } from '@common/game';
import { Coordinate, DoorTile } from '@common/map.types';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStub, SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { GameManagerGateway } from './game-manager.gateway';

describe('GameManagerGateway', () => {
    let gateway: GameManagerGateway;
    let logger: SinonStubbedInstance<Logger>;
    let socket: SinonStubbedInstance<Socket>;
    let gameCreationService: SinonStubbedInstance<GameCreationService>;
    let gameManagerService: SinonStubbedInstance<GameManagerService>;
    let gameCountdownService: SinonStubbedInstance<GameCountdownService>;
    let journalService: SinonStubbedInstance<JournalService>;
    let serverStub: SinonStubbedInstance<Server>;

    beforeEach(async () => {
        logger = createStubInstance(Logger);
        socket = createStubInstance<Socket>(Socket);
        gameCreationService = createStubInstance<GameCreationService>(GameCreationService);
        gameManagerService = createStubInstance<GameManagerService>(GameManagerService);
        gameCountdownService = createStubInstance<GameCountdownService>(GameCountdownService);
        gameCountdownService.startNewCountdown.callsFake(() => {
            return Promise.resolve();
        });
        journalService = createStubInstance<JournalService>(JournalService);
        serverStub = createStubInstance<Server>(Server);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameManagerGateway,
                { provide: Logger, useValue: logger },
                { provide: GameCreationService, useValue: gameCreationService },
                { provide: GameManagerService, useValue: gameManagerService },
                { provide: GameCountdownService, useValue: gameCountdownService },
                { provide: JournalService, useValue: journalService },
            ],
        }).compile();

        gateway = module.get<GameManagerGateway>(GameManagerGateway);
        gateway['server'] = serverStub;

        const toStub = {
            emit: stub() as SinonStub,
        };
        serverStub.to.returns(toStub as any);
    });

    describe('getMoves', () => {
        it('should emit gameNotFound if the game does not exist', () => {
            gameCreationService.doesGameExist.returns(false);

            gateway.getMoves(socket, 'game-id');

            expect(gameCreationService.doesGameExist.calledWith('game-id')).toBeTruthy();
            expect((socket.emit as SinonStub).calledWith('gameNotFound')).toBeTruthy();
        });

        it('should emit playerPossibleMoves if the game exists', () => {
            gameCreationService.doesGameExist.returns(true);
            const moves: Array<[string, { path: Coordinate[]; weight: number }]> = [['abc', { path: [{ x: 1, y: 1 }], weight: 1 }]];
            gameManagerService.getMoves.returns(moves);

            gateway.getMoves(socket, 'game-id');

            expect(gameCreationService.doesGameExist.calledWith('game-id')).toBeTruthy();
            expect((socket.emit as SinonStub).calledWith('playerPossibleMoves', moves)).toBeTruthy();
        });
    });

    describe('getMove', () => {
        it('should emit gameNotFound if the game does not exist', async () => {
            gameCreationService.doesGameExist.returns(false);

            await gateway.getMove(socket, { gameId: 'game-id', destination: { x: 2, y: 2 } });

            expect(gameCreationService.doesGameExist.calledWith('game-id')).toBeTruthy();
            expect((socket.emit as SinonStub).calledWith('gameNotFound')).toBeTruthy();
        });

        it('should emit positionToUpdate and youFell if the player falls', async () => {
            gameCreationService.doesGameExist.returns(true);

            const player: Player = { socketId: socket.id, position: { x: 1, y: 1 } } as Player;
            const game = { players: [player], currentTurn: 0, id: '1234', hostSocketId: 'host-1' } as Game;
            gameCreationService.getGameById.returns(game);

            const moves = [
                { x: 1, y: 1 },
                { x: 1, y: 2 },
            ];
            gameManagerService.getMove.returns(moves);
            gameManagerService.updatePosition.resolves();
            gameManagerService.hasFallen.returns(true);

            await gateway.getMove(socket, { gameId: 'game-id', destination: { x: 2, y: 2 } });

            expect(serverStub.to.calledWith('game-id')).toBeTruthy();

            const toRoomStub = serverStub.to('game-id').emit as SinonStub;
            expect(toRoomStub.calledWith('positionToUpdate', { game, player })).toBeTruthy();

            const toSocketStub = serverStub.to(socket.id).emit as SinonStub;
            expect(toSocketStub.calledWith('youFell')).toBeTruthy();
        });

        it('should emit youFinishedMoving if the player reaches the destination', async () => {
            gameCreationService.doesGameExist.returns(true);

            const player: Player = { socketId: socket.id, position: { x: 1, y: 1 } } as Player;
            const game = { players: [player], currentTurn: 0, id: 'game-id', hostSocketId: 'host-1' } as Game;
            gameCreationService.getGameById.returns(game);

            const moves = [
                { x: 1, y: 1 },
                { x: 1, y: 2 },
                { x: 2, y: 2 },
            ];
            gameManagerService.getMove.returns(moves);
            gameManagerService.updatePosition.resolves();

            await gateway.getMove(socket, { gameId: 'game-id', destination: { x: 2, y: 2 } });
            expect(gameManagerService.updatePosition.calledWithMatch('game-id', socket.id, [moves[1]])).toBeTruthy();
            expect(serverStub.to.calledWith('game-id')).toBeTruthy();

            const toRoomStub = serverStub.to('game-id').emit as SinonStub;
            expect(toRoomStub.calledWith('positionToUpdate', { game, player })).toBeTruthy();

            const toSocketStub = serverStub.to(socket.id).emit as SinonStub;
            expect(toSocketStub.calledWith('youFinishedMoving')).toBeTruthy();
        });
    });

    describe('endTurn', () => {
        let startTurnSpy: SinonStub;

        beforeEach(() => {
            startTurnSpy = stub(gateway, 'startTurn');
        });

        afterEach(() => {
            startTurnSpy.restore();
        });

        it('should return without calling startTurn if player socketId does not match client id', () => {
            const game = {
                id: 'game-id',
                players: [
                    {
                        socketId: 'different-socket-id',
                        turn: 0,
                        specs: { speed: 3, movePoints: 3, attack: 5, defense: 5 },
                        isActive: true,
                    },
                ],
                currentTurn: 0,
            } as Game;

            gameCreationService.getGameById.returns(game);

            gateway.endTurn(socket, 'game-id');

            expect(startTurnSpy.notCalled).toBeTruthy();
            expect(game.players[0].specs.movePoints).toBe(3);
        });

        it('should update attack and defense when player is on ice tile', () => {
            const game = {
                id: 'game-id',
                players: [
                    {
                        socketId: socket.id,
                        turn: 0,
                        specs: { attack: 5, defense: 5, speed: 3, movePoints: 3 },
                        position: { x: 0, y: 0 },
                        isActive: true,
                    },
                ],
                currentTurn: 0,
            } as Game;

            gameCreationService.getGameById.returns(game);
            gameManagerService.onIceTile.returns(true);

            gateway.endTurn(socket, 'game-id');

            const player = game.players[0];
            expect(player.specs.movePoints).toBe(player.specs.speed);

            expect(startTurnSpy.calledWith('game-id')).toBeTruthy();
        });

        it('should not update attack and defense if player is not on ice tile', () => {
            const game = {
                id: 'game-id',
                players: [
                    {
                        socketId: socket.id,
                        turn: 0,
                        specs: { attack: 5, defense: 5, speed: 3, movePoints: 3 },
                        position: { x: 0, y: 0 },
                        isActive: true,
                    },
                ],
                currentTurn: 0,
            } as Game;

            gameCreationService.getGameById.returns(game);
            gameManagerService.onIceTile.returns(false);

            gateway.endTurn(socket, 'game-id');

            const player = game.players[0];
            expect(player.specs.attack).toBe(5);
            expect(player.specs.defense).toBe(5);
            expect(player.specs.movePoints).toBe(player.specs.speed);

            expect(startTurnSpy.calledWith('game-id')).toBeTruthy();
        });
    });

    describe('startTurn', () => {
        it('should emit yourTurn to the active player and playerTurn to others', () => {
            const activePlayer: Player = {
                socketId: 'active-player-id',
                turn: 0,
                isActive: true,
                name: 'ActivePlayer',
                specs: { speed: 5, movePoints: 0, attack: 10, defense: 10 },
            } as Player;

            const otherPlayer: Player = {
                socketId: 'other-player-id',
                turn: 1,
                isActive: true,
                name: 'OtherPlayer',
                specs: { speed: 5, movePoints: 0 },
            } as Player;

            const game: Game = {
                players: [activePlayer, otherPlayer],
                currentTurn: 0,
                id: 'game-id',
            } as Game;

            gameCreationService.getGameById.returns(game);
            gameManagerService.onIceTile.returns(true);
            gameManagerService.isGameResumable.returns(true);

            gateway.startTurn('game-id');

            expect(journalService.logMessage.calledWith('game-id', `C'est au tour de ActivePlayer.`, ['ActivePlayer', 'OtherPlayer'])).toBeTruthy();

            expect(activePlayer.specs.movePoints).toBe(activePlayer.specs.speed);

            const toActivePlayerStub = serverStub.to(activePlayer.socketId).emit as SinonStub;
            expect(toActivePlayerStub.calledWith('yourTurn', activePlayer)).toBeTruthy();

            const toOtherPlayerStub = serverStub.to(otherPlayer.socketId).emit as SinonStub;
            expect(toOtherPlayerStub.calledWith('playerTurn', activePlayer.name)).toBeTruthy();
        });

        it('should skip to the next player if the active player is inactive', () => {
            const inactivePlayer: Player = {
                socketId: 'inactive-player-id',
                turn: 0,
                isActive: false,
                specs: { speed: 5, movePoints: 0 },
            } as Player;

            const activePlayer: Player = {
                socketId: 'active-player-id',
                turn: 1,
                isActive: true,
                specs: { speed: 5, movePoints: 0 },
            } as Player;

            const game: Game = {
                players: [inactivePlayer, activePlayer],
                currentTurn: 0,
                id: 'game-id',
            } as Game;

            gameCreationService.getGameById.returns(game);
            gameManagerService.isGameResumable.returns(true);
            gateway.startTurn('game-id');

            expect(game.currentTurn).toBe(1);

            const toActivePlayerStub = serverStub.to(activePlayer.socketId).emit as SinonStub;
            expect(toActivePlayerStub.calledWith('yourTurn', activePlayer)).toBeTruthy();
        });
    });

    describe('startGame', () => {
        let startTurnSpy: SinonStub;

        beforeEach(() => {
            startTurnSpy = stub(gateway, 'startTurn');
        });

        afterEach(() => {
            startTurnSpy.restore();
        });

        it('should call startTurn with the given gameId', () => {
            const gameId = 'game-id';

            gateway.startGame(socket, gameId);

            expect(startTurnSpy.calledWith(gameId)).toBeTruthy();
        });
    });
    describe('moveToPosition', () => {
        let player: Player;
        let game: Game;

        beforeEach(() => {
            player = {
                socketId: 'player-1',
                name: 'Player 1',
                specs: { attack: 10, defense: 10, movePoints: 5, speed: 5 },
                position: { x: 0, y: 0 },
            } as Player;

            game = {
                id: 'game-1',
                players: [player],
                currentTurn: 0,
                hasStarted: true,
            } as Game;

            gameCreationService.getGameById.returns(game);
        });
        it('should return without emitting if moves length is 0', () => {
            gameCreationService.doesGameExist.returns(true);

            const player: Player = { socketId: socket.id, position: { x: 1, y: 1 } } as Player;
            const game = { players: [player], currentTurn: 0, id: 'game-id', hostSocketId: 'host-1' } as Game;
            gameCreationService.getGameById.returns(game);

            gameManagerService.getMove.returns([]);

            gateway.getMove(socket, { gameId: 'game-id', destination: { x: 2, y: 2 } });

            expect(gameManagerService.updatePosition.notCalled).toBeTruthy();
        });
        it('should apply -2 penalty to attack and defense when moving to an ice tile', async () => {
            gameCreationService.doesGameExist.returns(true);
            gameManagerService.getMove.returns([
                { x: 0, y: 1 },
                { x: 0, y: 1 },
            ]);
            gameManagerService.onIceTile.withArgs(player, game.id).onFirstCall().returns(false);
            gameManagerService.onIceTile.withArgs(player, game.id).onSecondCall().returns(true);

            const destination: Coordinate = { x: 0, y: 1 };

            await gateway.getMove({ id: player.socketId } as any, { gameId: game.id, destination });

            expect(player.specs.attack).toBe(8);
            expect(player.specs.defense).toBe(8);
        });

        it('should remove -2 penalty from attack and defense when moving off an ice tile', async () => {
            player.specs.attack = 8;
            player.specs.defense = 8;
            gameCreationService.doesGameExist.returns(true);
            gameManagerService.getMove.returns([
                { x: 0, y: 2 },
                { x: 0, y: 2 },
            ]);
            gameManagerService.onIceTile.withArgs(player, game.id).onFirstCall().returns(true);
            gameManagerService.onIceTile.withArgs(player, game.id).onSecondCall().returns(false);

            const destination: Coordinate = { x: 0, y: 2 };

            await gateway.getMove({ id: player.socketId } as any, { gameId: game.id, destination });

            expect(player.specs.attack).toBe(10);
            expect(player.specs.defense).toBe(10);
        });

        it('should not change attack and defense if remaining on the same type of tile', async () => {
            gameCreationService.doesGameExist.returns(true);
            gameManagerService.getMove.returns([{ x: 1, y: 1 }]);
            gameManagerService.onIceTile.returns(false);

            const destination: Coordinate = { x: 1, y: 1 };

            await gateway.getMove({ id: player.socketId } as any, { gameId: game.id, destination });

            expect(player.specs.attack).toBe(10);
            expect(player.specs.defense).toBe(10);
        });
    });

    describe('getCombats', () => {
        it('should emit an empty array if no adjacent players are found', () => {
            const gameId = 'test-game-id';
            const clientId = 'client-id';
            const player = { socketId: clientId, position: { x: 5, y: 5 }, specs: { speed: 5 } as Specs };

            gameCreationService.getGameById.returns({ players: [player] } as any);
            gameManagerService.getAdjacentPlayers.returns([]);
            Object.defineProperty(socket, 'id', {
                value: clientId,
                writable: false,
                configurable: false,
            });

            gateway.getCombats(socket, gameId);

            const emitStub = serverStub.to(clientId).emit as SinonStub;
            expect(emitStub.calledWith('yourCombats', [])).toBeTruthy();
            expect(gameManagerService.getAdjacentPlayers.calledWith(player, gameId)).toBeTruthy();
        });
    });

    describe('afterInit', () => {
        let startTurnSpy: SinonStub;

        beforeEach(() => {
            startTurnSpy = stub(gateway, 'startTurn');
        });

        afterEach(() => {
            startTurnSpy.restore();
        });

        it('should set up the timeout listener on gameCountdownService once', () => {
            const endTurnSpy = jest.spyOn(gateway, 'prepareNextTurn');
            const onSpy = jest.spyOn(gameCountdownService, 'on').mockImplementation((eventName, listener) => {
                if (eventName === 'timeout') {
                    listener('test-game-id');
                }
                return gameCountdownService;
            });

            gateway.afterInit(serverStub);

            expect(onSpy).toHaveBeenCalledWith('timeout', expect.any(Function));
            expect(endTurnSpy).toHaveBeenCalledWith('test-game-id');

            endTurnSpy.mockRestore();
            onSpy.mockRestore();
        });
    });

    describe('prepareNextTurn', () => {
        let startTurnSpy: SinonStub;

        beforeEach(() => {
            startTurnSpy = stub(gateway, 'startTurn');
        });

        afterEach(() => {
            startTurnSpy.restore();
        });
        it('should reset turn counter if the player is inactive', () => {
            const game = {
                id: 'game-id',
                players: [{ socketId: 'inactive-player', turn: 0, isActive: false, specs: { speed: 5 } as Specs }],
                currentTurn: 0,
            } as Game;

            gameCreationService.getGameById.returns(game);
            const updateTurnCounterSpy = jest.spyOn(gameManagerService, 'updateTurnCounter');

            gateway.prepareNextTurn('game-id');

            expect(updateTurnCounterSpy).toHaveBeenCalledWith('game-id');
            updateTurnCounterSpy.mockRestore();
        });

        it('should reset timer subscription with correct gameId', () => {
            const game = {
                id: 'game-id',
                players: [{ socketId: 'active-player', turn: 0, isActive: true, specs: { speed: 5 } as Specs }],
                currentTurn: 0,
            } as Game;
            gameCreationService.getGameById.returns(game);

            gateway.prepareNextTurn('game-id');
            expect(gameCountdownService.resetTimerSubscription.calledWith('game-id')).toBeTruthy();
        });
    });
    // describe('toggleDoor', () => {
    //     it('should toggle door and emit doorToggled if the door is adjacent and no player is on it', () => {
    //         const gameId = 'game-id';
    //         const doorTile: DoorTile = { coordinate: { x: 3, y: 3 }, isOpened: false };
    //         const game = {
    //             doorTiles: [doorTile],
    //             id: gameId,
    //         } as Game;

    //         gameCreationService.getGameById.returns(game);

    //         gateway.toggleDoor(socket, { gameId, door: doorTile });

    //         expect(doorTile.isOpened).toBe(true);
    //         expect(serverStub.to.calledWith(gameId)).toBeTruthy();
    //     });

    //     it('should not toggle door if a player is on the door tile', () => {
    //         const gameId = 'game-id';
    //         const doorTile: DoorTile = { coordinate: { x: 3, y: 3 }, isOpened: false };
    //         const game = { doorTiles: [doorTile], id: gameId } as Game;

    //         gameCreationService.getGameById.returns(game);

    //         gateway.toggleDoor(socket, { gameId, door: doorTile });

    //         expect(doorTile.isOpened).toBe(false);
    //         expect(serverStub.to.called).toBeFalsy();
    //     });
    // });

    describe('getAdjacentDoors', () => {
        it('should emit adjacent doors for the player', () => {
            const gameId = 'game-id';
            const clientId = 'client-id';
            const player = { socketId: clientId, position: { x: 4, y: 4 } } as Player;
            const doorTile = { coordinate: { x: 4, y: 5 }, isOpened: false } as DoorTile;

            gameCreationService.getGameById.returns({ players: [player], doorTiles: [doorTile] } as Game);
            gameManagerService.getAdjacentDoors.returns([doorTile]);
            Object.defineProperty(socket, 'id', { value: clientId });

            gateway.getAdjacentDoors(socket, gameId);

            expect(gameManagerService.getAdjacentDoors.calledWith(player, gameId)).toBeTruthy();
        });
    });
});
