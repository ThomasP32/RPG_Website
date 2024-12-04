import { GameCountdownService } from '@app/services/countdown/game/game-countdown.service';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameManagerService } from '@app/services/game-manager/game-manager.service';
import { JournalService } from '@app/services/journal/journal.service';
import { CombatEvents } from '@common/events/combat.events';
import { GameCreationEvents } from '@common/events/game-creation.events';
import { ItemDroppedData, ItemsEvents } from '@common/events/items.events';
import { Game, Player, Specs } from '@common/game';
import { Coordinate, DoorTile, ItemCategory, Tile, TileCategory } from '@common/map.types';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStub, SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { ItemsManagerService } from '../../../../services/items-manager/items-manager.service';
import { VirtualGameManagerService } from '../../../../services/virtual-game-manager/virtual-game-manager.service';
import { GameManagerGateway } from './game-manager.gateway';

describe('GameManagerGateway', () => {
    let gateway: GameManagerGateway;
    let logger: SinonStubbedInstance<Logger>;
    let socket: SinonStubbedInstance<Socket>;
    let gameCreationService: SinonStubbedInstance<GameCreationService>;
    let gameManagerService: SinonStubbedInstance<GameManagerService>;
    let gameCountdownService: SinonStubbedInstance<GameCountdownService>;
    let itemsManagerService: SinonStubbedInstance<ItemsManagerService>;
    let journalService: SinonStubbedInstance<JournalService>;
    let virtualGameManagerService: SinonStubbedInstance<VirtualGameManagerService>;
    let serverStub: SinonStubbedInstance<Server>;

    beforeEach(async () => {
        logger = createStubInstance(Logger);
        socket = createStubInstance<Socket>(Socket);
        gameCreationService = createStubInstance<GameCreationService>(GameCreationService);
        gameManagerService = createStubInstance<GameManagerService>(GameManagerService);
        itemsManagerService = createStubInstance<ItemsManagerService>(ItemsManagerService);
        gameCountdownService = createStubInstance<GameCountdownService>(GameCountdownService);
        gameCountdownService.startNewCountdown.callsFake(() => {
            return Promise.resolve();
        });
        journalService = createStubInstance<JournalService>(JournalService);
        virtualGameManagerService = createStubInstance<VirtualGameManagerService>(VirtualGameManagerService);
        serverStub = createStubInstance<Server>(Server);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameManagerGateway,
                { provide: Logger, useValue: logger },
                { provide: GameCreationService, useValue: gameCreationService },
                { provide: GameManagerService, useValue: gameManagerService },
                { provide: GameCountdownService, useValue: gameCountdownService },
                { provide: JournalService, useValue: journalService },
                { provide: VirtualGameManagerService, useValue: virtualGameManagerService },
                { provide: ItemsManagerService, useValue: itemsManagerService },
            ],
        }).compile();

        gateway = module.get<GameManagerGateway>(GameManagerGateway);
        gateway['server'] = serverStub;

        const toStub = {
            emit: stub(),
        };
        serverStub.to.returns(toStub as any);
    });

    describe('getMoves', () => {
        it('should emit gameNotFound if the game does not exist', () => {
            gameCreationService.doesGameExist.returns(false);

            gateway.getMoves(socket, 'game-id');

            expect(gameCreationService.doesGameExist.calledWith('game-id')).toBeTruthy();
            expect((socket.emit as SinonStub).calledWith(GameCreationEvents.GameNotFound)).toBeTruthy();
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
        it('should emit gameFinishedPlayerWon if checkForWinnerCtf returns true', async () => {
            gameCreationService.doesGameExist.returns(true);

            const player: Player = { socketId: socket.id, position: { x: 1, y: 1 }, name: 'Player 1', inventory: [] } as Player;
            const game = { players: [player], currentTurn: 0, id: 'game-id', hostSocketId: 'host-1' } as Game;
            gameCreationService.getGameById.returns(game);

            const moves = [
                { x: 1, y: 1 },
                { x: 1, y: 2 },
            ];
            gameManagerService.getMove.returns(moves);
            gameManagerService.checkForWinnerCtf.returns(true);

            await gateway.getMove(socket, { gameId: 'game-id', destination: { x: 2, y: 2 } });

            expect(gameManagerService.checkForWinnerCtf.calledWith(player, 'game-id')).toBeTruthy();
            const toRoomStub = serverStub.to('game-id').emit as SinonStub;
            expect(toRoomStub.calledWith(CombatEvents.GameFinishedPlayerWon, player)).toBeTruthy();
        });

        it('should emit gameNotFound if the game does not exist', async () => {
            gameCreationService.doesGameExist.returns(false);

            await gateway.getMove(socket, { gameId: 'game-id', destination: { x: 2, y: 2 } });

            expect(gameCreationService.doesGameExist.calledWith('game-id')).toBeTruthy();
            expect((socket.emit as SinonStub).calledWith(GameCreationEvents.GameNotFound)).toBeTruthy();
        });

        it('should emit flagPickedUp and youFinishedMoving when the player picks up the flag', async () => {
            gameCreationService.doesGameExist.returns(true);

            const player: Player = { socketId: socket.id, position: { x: 1, y: 1 }, name: 'Player 1', inventory: ['sword'] } as Player;
            const game = { players: [player], currentTurn: 0, id: 'game-id', hostSocketId: 'host-1' } as Game;
            gameCreationService.getGameById.returns(game);

            player.inventory.push(ItemCategory.Flag);

            gameManagerService.getMove.returns([
                { x: 1, y: 1 },
                { x: 2, y: 2 },
            ]);

            gameManagerService.hasPickedUpFlag.returns(true);

            await gateway.getMove(socket, { gameId: 'game-id', destination: { x: 2, y: 2 } });

            const toRoomStub = serverStub.to('game-id').emit as SinonStub;
            expect(toRoomStub.calledWith('flagPickedUp', game)).toBeTruthy();

            const toSocketStub = serverStub.to(socket.id).emit as SinonStub;
            expect(toSocketStub.calledWith('youFinishedMoving')).toBeTruthy();

            expect(journalService.logMessage.calledWith('game-id', `Le drapeau a été récupéré par ${player.name}.`, [player.name])).toBeTruthy();
        });

        it('should emit youFinishedMoving if the player reaches the destination', async () => {
            gameCreationService.doesGameExist.returns(true);

            const player: Player = { socketId: socket.id, position: { x: 1, y: 1 }, inventory: [] } as Player;
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
            jest.clearAllTimers();
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
                        inventory: [ItemCategory.WallBreaker, ItemCategory.Armor],
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
                        inventory: [ItemCategory.WallBreaker, ItemCategory.Armor],
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
                        inventory: [ItemCategory.WallBreaker, ItemCategory.Armor],
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
        beforeEach(() => {
            jest.useFakeTimers();
        });
        afterEach(() => {
            jest.clearAllTimers();
        });
        afterAll(() => {
            jest.useRealTimers();
        });
        it('should emit yourTurn to the active player and playerTurn to others', () => {
            const activePlayer: Player = {
                socketId: 'active-player-id',
                turn: 0,
                isActive: true,
                inventory: [ItemCategory.WallBreaker, ItemCategory.Armor],
                name: 'ActivePlayer',
                specs: { speed: 5, movePoints: 0, attack: 10, defense: 10 },
            } as Player;

            const otherPlayer: Player = {
                socketId: 'other-player-id',
                turn: 1,
                isActive: true,
                inventory: [ItemCategory.WallBreaker, ItemCategory.Armor],
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
                inventory: [ItemCategory.WallBreaker, ItemCategory.Armor],
                specs: { speed: 5, movePoints: 0 },
            } as Player;

            const activePlayer: Player = {
                socketId: 'active-player-id',
                turn: 1,
                isActive: true,
                inventory: [ItemCategory.WallBreaker, ItemCategory.Armor],
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

        it('should emit positionToUpdate to the virtualPlayer', () => {
            const activePlayer: Player = {
                socketId: 'virtualPlayer-id',
                turn: 0,
                isActive: true,
                inventory: [ItemCategory.WallBreaker, ItemCategory.Armor],
                name: 'ActivePlayer',
                specs: { speed: 5, movePoints: 0, attack: 10, defense: 10 },
            } as Player;

            const otherPlayer: Player = {
                socketId: 'other-player-id',
                turn: 1,
                isActive: true,
                inventory: [ItemCategory.WallBreaker, ItemCategory.Armor],
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
            expect(toActivePlayerStub.calledWith('positionToUpdate', activePlayer)).toBeFalsy();

            const toOtherPlayerStub = serverStub.to(otherPlayer.socketId).emit as SinonStub;
            expect(toOtherPlayerStub.calledWith('playerTurn', activePlayer.name)).toBeTruthy();
        });
    });

    describe('startGame', () => {
        let startTurnSpy: SinonStub;

        beforeEach(() => {
            startTurnSpy = stub(gateway, 'startTurn');
        });

        afterEach(() => {
            startTurnSpy.restore();
            jest.clearAllTimers();
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
                inventory: [],
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

            const player: Player = { socketId: socket.id, position: { x: 1, y: 1 }, inventory: [] } as Player;
            const game = { players: [player], currentTurn: 0, id: 'game-id', hostSocketId: 'host-1' } as Game;
            gameCreationService.getGameById.returns(game);

            gameManagerService.getMove.returns([]);

            gateway.getMove(socket, { gameId: 'game-id', destination: { x: 2, y: 2 } });

            expect(gameManagerService.updatePosition.notCalled).toBeTruthy();
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
            jest.clearAllTimers();
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
            jest.clearAllTimers();
        });

        it('should reset turn counter if the player is inactive', () => {
            const game = {
                id: 'game-id',
                players: [
                    {
                        socketId: 'inactive-player',
                        turn: 0,
                        isActive: false,
                        specs: { speed: 5 } as Specs,
                        inventory: [ItemCategory.WallBreaker, ItemCategory.Armor],
                    },
                ],
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
                players: [
                    {
                        socketId: 'active-player',
                        turn: 0,
                        isActive: true,
                        specs: { speed: 5 } as Specs,
                        inventory: [ItemCategory.WallBreaker, ItemCategory.Armor],
                    },
                ],
                currentTurn: 0,
            } as Game;
            gameCreationService.getGameById.returns(game);

            gateway.prepareNextTurn('game-id');
            expect(gameCountdownService.resetTimerSubscription.calledWith('game-id')).toBeTruthy();
        });
    });

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

    describe('toggleDoor', () => {
        let game: Game;
        let doorTile: DoorTile;
        let socket: Partial<Socket>;

        beforeEach(() => {
            doorTile = { coordinate: { x: 3, y: 3 }, isOpened: false };
            game = {
                id: 'game-id',
                players: [{ socketId: 'client-id', position: { x: 2, y: 2 } }],
                doorTiles: [doorTile],
                nDoorsManipulated: [],
            } as Game;

            gameCreationService.getGameById.returns(game);
            socket = {
                id: 'client-id',
            };
        });

        it('should toggle door and emit doorToggled if the door is adjacent and no player is on it', () => {
            gateway.toggleDoor(socket as Socket, { gameId: game.id, door: doorTile });

            expect(doorTile.isOpened).toBe(true);
            expect(game.nDoorsManipulated).toContainEqual(doorTile.coordinate);

            expect(serverStub.to.calledWith(game.id)).toBeTruthy();
            const toRoomStub = serverStub.to(game.id).emit as SinonStub;
            expect(toRoomStub.calledWith('doorToggled', { game, player: game.players[0] })).toBeTruthy();
        });
    });
    describe('dropItem', () => {
        it('should drop the item and emit ItemDropped event', () => {
            const player: Player = { socketId: socket.id, position: { x: 1, y: 1 }, name: 'Player 1', inventory: [] } as Player;
            const game = { players: [player], currentTurn: 0, id: 'game-id', hostSocketId: 'host-1' } as Game;
            gameCreationService.getGameById.returns(game);
            const gameId = game.id;
            const itemDropping = ItemCategory.Sword;

            gameCreationService.getGameById.returns(game);

            gateway.dropItem(socket, { gameId, itemDropping });

            expect(itemsManagerService.dropItem.calledWith(itemDropping, gameId, player, player.position)).toBeTruthy();
            const emitStub = serverStub.to(player.socketId).emit as SinonStub;
            expect(emitStub.calledWith(ItemsEvents.ItemDropped, { updatedGame: game, updatedPlayer: player })).toBeTruthy();
        });
    });
    describe('movePlayer', () => {
        let player: Player;
        let game: Game;
        let moves: Coordinate[];

        beforeEach(() => {
            player = {
                socketId: 'player-1',
                name: 'Player 1',
                specs: { attack: 10, defense: 10, movePoints: 5, speed: 5 },
                position: { x: 0, y: 0 },
                inventory: [],
            } as Player;

            game = {
                id: 'game-1',
                players: [player],
                currentTurn: 0,
                hasStarted: true,
            } as Game;

            moves = [
                { x: 1, y: 1 },
                { x: 2, y: 2 },
            ];

            gameCreationService.getGameById.returns(game);
        });

        it('should update player position for each move', async () => {
            gameManagerService.updatePosition.resolves();
            itemsManagerService.onItem.returns(false);
            gameManagerService.checkForWinnerCtf.returns(false);

            await gateway.movePlayer(moves, game, false, player);

            expect(gameManagerService.updatePosition.calledWith(game.id, player.socketId, [moves[0]])).toBeTruthy();
            expect(gameManagerService.updatePosition.calledWith(game.id, player.socketId, [moves[1]])).toBeTruthy();
        });

        it('should pick up item if player is on item', async () => {
            gameManagerService.updatePosition.resolves();
            itemsManagerService.onItem.returns(true);
            gameManagerService.checkForWinnerCtf.returns(false);

            await gateway.movePlayer(moves, game, false, player);

            expect(itemsManagerService.pickUpItem.calledWith(moves[0], game.id, player)).toBeTruthy();
        });

        it('should emit InventoryFull if player inventory exceeds limit', async () => {
            const activePlayer: Player = {
                socketId: 'active-player-id',
                turn: 0,
                isActive: true,
                inventory: [ItemCategory.WallBreaker, ItemCategory.Armor, ItemCategory.Sword],
                name: 'ActivePlayer',
                specs: { speed: 5, movePoints: 0, attack: 10, defense: 10 },
            } as Player;

            gameManagerService.updatePosition.resolves();
            itemsManagerService.onItem.returns(true);
            gameManagerService.checkForWinnerCtf.returns(false);

            await gateway.movePlayer(moves, game, false, activePlayer);

            const toActivePlayerStub = serverStub.to(activePlayer.socketId).emit as SinonStub;
            expect(toActivePlayerStub.calledWith(ItemsEvents.InventoryFull)).toBeTruthy();
        });
    });

    describe('getMove - Player Falling Scenario', () => {
        beforeEach(() => {
            Object.defineProperty(socket, 'id', {
                value: 'virtualPlayer-1',
                writable: false,
            });
        });

        it('should emit youFell to the client and virtualPlayerFinishedMoving if the player has fallen', async () => {
            gameCreationService.doesGameExist.returns(true);

            const player: Player = {
                socketId: 'virtualPlayer-1',
                position: { x: 1, y: 1 },
                name: 'Virtual Player',
                inventory: [ItemCategory.Amulet],
            } as Player;

            const game: Game = {
                players: [player],
                id: 'game-id',
                hostSocketId: 'host-1',
            } as Game;

            gameCreationService.getGameById.returns(game);
            gameManagerService.getMove.returns([{ x: 1, y: 2 }]);
            gameManagerService.hasFallen = true;

            await gateway.getMove(socket, { gameId: 'game-id', destination: { x: 2, y: 2 } });

            expect(serverStub.to.calledWith(socket.id)).toBeTruthy();
            const toClientStub = serverStub.to(socket.id).emit as SinonStub;
            expect(toClientStub.calledWith('youFell')).toBeTruthy();

            expect(serverStub.to.calledWith(game.id)).toBeTruthy();
            const toRoomStub = serverStub.to(game.id).emit as SinonStub;
            expect(toRoomStub.calledWith('virtualPlayerFinishedMoving', game.id)).toBeTruthy();

            expect(gameManagerService.hasFallen).toBe(false);
        });
    });
    describe('startTurn', () => {
        it("should drop an item if a player has more than 2 items at the beginning of another player's turn", () => {
            const activePlayer: Player = {
                socketId: 'active-player-id',
                turn: 0,
                isActive: true,
                inventory: [ItemCategory.WallBreaker, ItemCategory.Armor],
                name: 'ActivePlayer',
                specs: { speed: 5, movePoints: 0, attack: 10, defense: 10 },
            } as Player;

            const otherPlayer: Player = {
                socketId: 'other-player-id',
                turn: 1,
                isActive: true,
                inventory: [ItemCategory.WallBreaker, ItemCategory.Armor, ItemCategory.Sword],
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

            expect(itemsManagerService.dropItem.calledWith(otherPlayer.inventory[2], game.id, otherPlayer, otherPlayer.position)).toBeTruthy();
            const itemDroppedData: ItemDroppedData = { updatedGame: game, updatedPlayer: otherPlayer };
            const toOtherPlayerStub = serverStub.to(otherPlayer.socketId).emit as SinonStub;
            expect(toOtherPlayerStub.calledWith(ItemsEvents.ItemDropped, itemDroppedData)).toBeTruthy();
        });
    });
    describe('breakWall', () => {
        let game: Game;
        let player: Player;
        let wallTile: Tile;
        let socket: Partial<Socket>;

        beforeEach(() => {
            player = {
                socketId: 'player-1',
                name: 'Player 1',
                specs: { attack: 10, defense: 10, movePoints: 5, speed: 5 },
                position: { x: 0, y: 0 },
                inventory: [],
            } as Player;

            wallTile = {
                coordinate: { x: 1, y: 1 },
                category: TileCategory.Wall,
            } as Tile;

            game = {
                id: 'game-1',
                players: [player],
                currentTurn: 0,
                hasStarted: true,
                tiles: [wallTile],
            } as Game;

            gameCreationService.getGameById.returns(game);

            socket = {
                id: 'player-1',
            };
        });

        it('should remove the wall tile from the game tiles', () => {
            const wallTiles = [wallTile];
            gameManagerService.getAdjacentWalls.returns(wallTiles);

            gateway.breakWall(socket as Socket, { gameId: game.id, wall: wallTile });

            expect(game.tiles).not.toContain(wallTile);
        });

        it('should update player actions', () => {
            const wallTiles = [wallTile];
            gameManagerService.getAdjacentWalls.returns(wallTiles);

            gateway.breakWall(socket as Socket, { gameId: game.id, wall: wallTile });

            expect(gameManagerService.updatePlayerActions.calledWith(game.id, player.socketId)).toBeTruthy();
        });

        it('should log a message to the journal', () => {
            const wallTiles = [wallTile];
            gameManagerService.getAdjacentWalls.returns(wallTiles);

            gateway.breakWall(socket as Socket, { gameId: game.id, wall: wallTile });

            expect(journalService.logMessage.calledWith(game.id, `${player.name}. a brisé un mur !`, [player.name])).toBeTruthy();
        });

        it('should emit wallBroken event to the game room', () => {
            const wallTiles = [wallTile];
            gameManagerService.getAdjacentWalls.returns(wallTiles);

            gateway.breakWall(socket as Socket, { gameId: game.id, wall: wallTile });

            const toRoomStub = serverStub.to(game.id).emit as SinonStub;
            expect(toRoomStub.calledWith('wallBroken', { game: game, player: player })).toBeTruthy();
        });

        it('should not remove any tiles if no adjacent walls are found', () => {
            gameManagerService.getAdjacentWalls.returns([]);

            gateway.breakWall(socket as Socket, { gameId: game.id, wall: wallTile });

            expect(game.tiles).toContain(wallTile);
        });
    });
    it('should not emit virtualPlayerFinishedMoving if the player is not a virtual player', async () => {
        gameCreationService.doesGameExist.returns(true);

        Object.defineProperty(socket, 'id', {
            value: 'realPlayer-1',
            writable: false,
        });

        const player: Player = {
            socketId: 'realPlayer-1',
            position: { x: 1, y: 1 },
            name: 'Real Player',
            inventory: [ItemCategory.Amulet],
        } as Player;

        const game: Game = {
            players: [player],
            id: 'game-id',
            hostSocketId: 'host-1',
        } as Game;

        gameCreationService.getGameById.returns(game);
        gameManagerService.getMove.returns([{ x: 1, y: 2 }]);
        gameManagerService.hasFallen = true;

        await gateway.getMove(socket as Socket, { gameId: 'game-id', destination: { x: 2, y: 2 } });

        expect(serverStub.to.calledWith(socket.id)).toBeTruthy();
        const toClientStub = serverStub.to(socket.id).emit as SinonStub;
        expect(toClientStub.calledWith('youFell')).toBeTruthy();

        expect(serverStub.to.calledWith(game.id)).toBeTruthy();
        const toRoomStub = serverStub.to(game.id).emit as SinonStub;
        expect(toRoomStub.calledWith('virtualPlayerFinishedMoving')).toBeFalsy();

        expect(gameManagerService.hasFallen).toBe(false);
    });
});
