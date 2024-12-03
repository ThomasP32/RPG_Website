import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameManagerService } from '@app/services/game-manager/game-manager.service';
import { ProfileType } from '@common/constants';
import { Avatar, Bonus, Game, Player, Specs } from '@common/game';
import { Coordinate, DoorTile, ItemCategory, Mode, Tile, TileCategory } from '@common/map.types';
import { Test, TestingModule } from '@nestjs/testing';

let specs: Specs = {
    life: 10,
    speed: 10,
    attack: 15,
    defense: 5,
    attackBonus: Bonus.D4,
    defenseBonus: Bonus.D6,
    movePoints: 10,
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

let game2: Game = {
    hasStarted: true,
    id: 'game-1',
    hostSocketId: 'host-1',
    name: 'Test Game Moves',
    description: 'A test game',
    imagePreview: 'some-image-url',
    mapSize: { x: 10, y: 10 },
    tiles: [
        { coordinate: { x: 0, y: 6 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 6 }, category: TileCategory.Wall },
        { coordinate: { x: 2, y: 6 }, category: TileCategory.Wall },
        { coordinate: { x: 3, y: 6 }, category: TileCategory.Wall },
        { coordinate: { x: 4, y: 6 }, category: TileCategory.Wall },
        { coordinate: { x: 5, y: 6 }, category: TileCategory.Wall },
        { coordinate: { x: 7, y: 6 }, category: TileCategory.Wall },
        { coordinate: { x: 8, y: 6 }, category: TileCategory.Wall },
        { coordinate: { x: 9, y: 6 }, category: TileCategory.Wall },

        { coordinate: { x: 4, y: 7 }, category: TileCategory.Ice },
        { coordinate: { x: 3, y: 7 }, category: TileCategory.Ice },
        { coordinate: { x: 2, y: 7 }, category: TileCategory.Ice },
        { coordinate: { x: 1, y: 7 }, category: TileCategory.Ice },
        { coordinate: { x: 0, y: 7 }, category: TileCategory.Ice },
        { coordinate: { x: 0, y: 8 }, category: TileCategory.Ice },

        { coordinate: { x: 5, y: 8 }, category: TileCategory.Water },
        { coordinate: { x: 6, y: 8 }, category: TileCategory.Water },
        { coordinate: { x: 7, y: 8 }, category: TileCategory.Water },
        { coordinate: { x: 6, y: 9 }, category: TileCategory.Water },
    ],
    doorTiles: [{ coordinate: { x: 6, y: 6 }, isOpened: false }],
    items: [],
    players: [player],
    currentTurn: 0,
    nTurns: 0,
    nDoorsManipulated: [],
    duration: 0,
    debug: false,
    mode: Mode.Classic,
    startTiles: [{ coordinate: { x: 1, y: 1 } }, { coordinate: { x: 19, y: 19 } }],
    isLocked: false,
};

describe('GameManagerService', () => {
    let gameManagerService: GameManagerService;
    let gameCreationServiceStub: Partial<GameCreationService>;

    beforeEach(async () => {
        gameCreationServiceStub = {
            getGameById: jest.fn().mockReturnValue(game2),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameManagerService,
                {
                    provide: GameCreationService,
                    useValue: gameCreationServiceStub,
                },
            ],
        }).compile();

        gameManagerService = module.get<GameManagerService>(GameManagerService);

        game2.players = [{ ...player }];
        game2.currentTurn = 0;
        game2.nTurns = 0;
    });

    describe('updatePosition', () => {
        it('should update the player position', () => {
            const newPosition: Coordinate[] = [{ x: 5, y: 5 }];
            const currentPlayer = game2.players[0];
            currentPlayer.specs.movePoints = 10;
            gameManagerService.updatePosition('game-1', currentPlayer.socketId, newPosition);

            expect(currentPlayer.position).toEqual(newPosition[0]);
            expect(currentPlayer.specs.movePoints).toEqual(9);
        });

        it('should not update the position if the player is not found', () => {
            const newPosition: Coordinate[] = [{ x: 0, y: 0 }];
            const initialPosition = { ...game2.players[0].position };

            gameManagerService.updatePosition('game-1', 'Nonexistent Player', newPosition);

            expect(game2.players[0].position).toEqual(initialPosition);
        });
    });

    describe('updateTurnCounter', () => {
        it('should increment nTurns and currentTurn', () => {
            game2.players.push({ ...player, name: 'Player 2' });
            gameManagerService.updateTurnCounter('game-1');

            expect(game2.currentTurn).toEqual(1);
        });

        it('should reset currentTurn to 0 when it reaches the number of players', () => {
            game2.players.push({ ...player, name: 'Player 2' });
            game2.currentTurn = 0;
            for (let i = 0; i < game2.players.length; i++) {
                gameManagerService.updateTurnCounter('game-1');
            }
            expect(game2.currentTurn).toEqual(0);
        });
    });

    describe('updatePlayerActions', () => {
        it('should decrement the player actions by 1', () => {
            const currentPlayer = game2.players[0];
            currentPlayer.specs.actions = 3;
            gameManagerService.updatePlayerActions('game-1', currentPlayer.socketId);

            expect(currentPlayer.specs.actions).toEqual(2);
        });

        it('should not change actions if the player is not found', () => {
            const initialActions = game2.players[0].specs.actions;
            gameManagerService.updatePlayerActions('game-1', 'Nonexistent Player');

            expect(game2.players[0].specs.actions).toEqual(initialActions);
        });
    });

    describe('getMoves', () => {
        it('should return an empty path if the player is not found', () => {
            const path = gameManagerService.getMoves(game2.id, 'Nonexistent Player');
            expect(path.length).toBe(0);
        });

        it('should return accessible moves based on move points', () => {
            game2.players[0].specs.movePoints = 5;
            game2.players[0].position = { x: 4, y: 4 };
            const moves = gameManagerService.getMoves(game2.id, game2.players[0].socketId);
            expect(moves.length).toBeGreaterThan(0);
            moves.forEach((move) => {
                expect(move[1].weight).toBeLessThanOrEqual(5);
            });
        });

        it('should return only the current position if the player has no move points', () => {
            const noMovePlayer = { ...player, socketId: '12345', name: 'NoMovePlayer', specs: { ...player.specs, movePoints: 0 } };
            game2.players.push(noMovePlayer);
            const moves = gameManagerService.getMoves(game2.id, noMovePlayer.socketId);
            expect(moves.length).toBe(1);
            expect(moves[0][1].path[0]).toEqual(noMovePlayer.position);
        });

        it('should not include unreachable wall tiles', () => {
            game2.players[0].position = { x: 4, y: 8 };
            const moves = gameManagerService.getMoves(game2.id, game2.players[0].socketId);
            expect(moves.some((move) => move[1].path.includes({ x: 0, y: 6 }))).toBeFalsy();
            expect(moves.some((move) => move[1].path.includes({ x: 9, y: 6 }))).toBeFalsy();
            expect(moves.some((move) => move[1].path.includes({ x: 6, y: 6 }))).toBeFalsy();
        });
    });

    describe('getMove', () => {
        it('should return an empty path if the player is not found', () => {
            const destination: Coordinate = { x: 2, y: 8 };
            const result = gameManagerService.getMove(game2.id, 'Nonexistent Player', destination);

            expect(result).toEqual([]);
        });

        it('should stop the path when falling into a tile with weight 0 and a 10% chance', () => {
            const destination: Coordinate = { x: 2, y: 8 };
            game2.players[0].isActive = true;
            jest.spyOn(global.Math, 'random').mockReturnValue(0.05);
            const result = gameManagerService.getMove(game2.id, game2.players[0].socketId, destination);

            expect(result.length).toBeLessThanOrEqual(5);
            expect(result[result.length - 1]).not.toEqual(destination);
        });

        it('should find a shorter path if available', () => {
            game2.players[0].position = { x: 5, y: 8 };
            game2.players[0].isActive = true;
            const destination: Coordinate = { x: 6, y: 9 };

            const path = gameManagerService.getMove(game2.id, game2.players[0].socketId, destination);

            expect(path).toContainEqual({ x: 6, y: 9 });
            expect(path.length).toBeGreaterThan(1);
        });
    });

    describe('onIceTile', () => {
        it('should return true if the player is on an ice tile', () => {
            player.position = { x: 4, y: 7 };
            const isOnIce = gameManagerService.onIceTile(player, game2.id);

            expect(isOnIce).toBe(true);
        });

        it('should return false if the player is on an empty tile with no defined category', () => {
            player.position = { x: 9, y: 9 };
            const isOnIce = gameManagerService.onIceTile(player, game2.id);

            expect(isOnIce).toBe(false);
        });
    });

    describe('getAdjacentPlayers', () => {
        let player: Player;
        let adjacentPlayer: Player;
        let nonAdjacentPlayer: Player;
        let game2: Game;

        beforeEach(async () => {
            const specs: Specs = {
                life: 10,
                speed: 10,
                attack: 15,
                defense: 5,
                attackBonus: Bonus.D4,
                defenseBonus: Bonus.D6,
                evasions: 2,
                movePoints: 10,
                actions: 2,
                nVictories: 0,
                nDefeats: 0,
                nCombats: 0,
                nEvasions: 0,
                nLifeTaken: 0,
                nLifeLost: 0,
                nItemsUsed: 0,
            };

            player = {
                socketId: 'player-1',
                name: 'Player 1',
                avatar: Avatar.Avatar1,
                isActive: true,
                position: { x: 5, y: 5 },
                initialPosition: { x: 5, y: 5 },
                specs,
                inventory: [],
                turn: 0,
                visitedTiles: [],
                profile: ProfileType.NORMAL,
            };

            adjacentPlayer = {
                socketId: 'player-2',
                name: 'Player 2',
                avatar: Avatar.Avatar2,
                isActive: true,
                position: { x: 5, y: 4 },
                initialPosition: { x: 5, y: 4 },
                specs,
                inventory: [],
                turn: 0,
                visitedTiles: [],
                profile: ProfileType.NORMAL,
            };

            nonAdjacentPlayer = {
                socketId: 'player-3',
                name: 'Player 3',
                avatar: Avatar.Avatar3,
                isActive: true,
                position: { x: 7, y: 7 },
                initialPosition: { x: 7, y: 7 },
                specs,
                inventory: [],
                turn: 0,
                visitedTiles: [],
                profile: ProfileType.NORMAL,
            };

            game2 = {
                hasStarted: true,
                id: 'game-1',
                hostSocketId: 'host-1',
                name: 'Test Game',
                description: 'A test game',
                imagePreview: 'some-image-url',
                mapSize: { x: 10, y: 10 },
                tiles: [],
                doorTiles: [],
                items: [],
                players: [player, adjacentPlayer, nonAdjacentPlayer],
                currentTurn: 0,
                nTurns: 0,
                nDoorsManipulated: [],
                duration: 0,
                debug: false,
                mode: Mode.Classic,
                startTiles: [],
                isLocked: false,
            };

            (gameCreationServiceStub.getGameById as jest.Mock).mockReturnValue(game2);
        });

        it('should return adjacent players when they are next to the player', () => {
            const result = gameManagerService.getAdjacentPlayers(player, game2.id);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(adjacentPlayer);
        });

        it('should return an empty array if there are no adjacent players', () => {
            adjacentPlayer.position = { x: 8, y: 8 };

            const result = gameManagerService.getAdjacentPlayers(player, game2.id);
            expect(result).toEqual([]);
        });

        it('should not include the player themselves in the result', () => {
            const result = gameManagerService.getAdjacentPlayers(player, game2.id);
            expect(result).not.toContainEqual(player);
        });

        it('should return multiple adjacent players if more than one player is adjacent', () => {
            const anotherAdjacentPlayer: Player = {
                socketId: 'player-4',
                name: 'Player 4',
                avatar: Avatar.Avatar4,
                isActive: true,
                position: { x: 6, y: 5 },
                initialPosition: { x: 6, y: 5 },
                specs: { ...player.specs },
                inventory: [],
                turn: 0,
                visitedTiles: [],
                profile: ProfileType.NORMAL,
            };

            game2.players.push(anotherAdjacentPlayer);

            const result = gameManagerService.getAdjacentPlayers(player, game2.id);
            expect(result).toHaveLength(2);
            expect(result).toContainEqual(adjacentPlayer);
            expect(result).toContainEqual(anotherAdjacentPlayer);
        });

        it('should not return inactive players even if they are adjacent', () => {
            adjacentPlayer.isActive = false;

            const result = gameManagerService.getAdjacentPlayers(player, game2.id);
            expect(result).toEqual([]);
        });
    });
    describe('getAdjacentDoors', () => {
        it('should return adjacent doors when they are next to the player', () => {
            const doorTile: DoorTile = { coordinate: { x: 4, y: 5 }, isOpened: false };
            game2.doorTiles = [doorTile];
            player.position = { x: 4, y: 4 };

            const adjacentDoors = gameManagerService.getAdjacentDoors(player, game2.id);

            expect(adjacentDoors).toHaveLength(1);
            expect(adjacentDoors[0]).toEqual(doorTile);
        });

        it('should return an empty array if there are no adjacent doors', () => {
            const doorTile: DoorTile = { coordinate: { x: 6, y: 6 }, isOpened: false };
            game2.doorTiles = [doorTile];
            player.position = { x: 4, y: 4 };

            const adjacentDoors = gameManagerService.getAdjacentDoors(player, game2.id);

            expect(adjacentDoors).toEqual([]);
        });

        it('should not return doors that are not adjacent to the player', () => {
            game2.doorTiles = [
                { coordinate: { x: 2, y: 2 }, isOpened: false },
                { coordinate: { x: 7, y: 7 }, isOpened: false },
            ];
            player.position = { x: 5, y: 5 };

            const adjacentDoors = gameManagerService.getAdjacentDoors(player, game2.id);

            expect(adjacentDoors).toEqual([]);
        });
    });

    describe('adaptSpecsForIceTileMove', () => {
        let wasOnIceTile: boolean;

        beforeEach(() => {
            wasOnIceTile = false;
            player.specs = { ...specs };
        });

        it('should not apply penalties when moving onto an ice tile with skates', () => {
            player.position = { x: 4, y: 7 };
            player.inventory = [ItemCategory.IceSkates];

            wasOnIceTile = gameManagerService.adaptSpecsForIceTileMove(player, game2.id, wasOnIceTile);

            expect(player.specs.attack).toBe(specs.attack);
            expect(player.specs.defense).toBe(specs.defense);
            expect(wasOnIceTile).toBe(false);
        });

        it('should not remove penalties when moving off an ice tile with skates', () => {
            player.position = { x: 5, y: 5 };
            player.inventory = [ItemCategory.IceSkates];
            wasOnIceTile = true;

            wasOnIceTile = gameManagerService.adaptSpecsForIceTileMove(player, game2.id, wasOnIceTile);

            expect(player.specs.attack).toBe(specs.attack);
            expect(player.specs.defense).toBe(specs.defense);
            expect(wasOnIceTile).toBe(true);
        });

        it('should do nothing if staying on the same ice tile', () => {
            player.position = { x: 4, y: 7 };
            player.inventory = [];
            wasOnIceTile = true;

            wasOnIceTile = gameManagerService.adaptSpecsForIceTileMove(player, game2.id, wasOnIceTile);

            expect(player.specs.attack).toBe(specs.attack);
            expect(player.specs.defense).toBe(specs.defense);
            expect(wasOnIceTile).toBe(true);
        });

        it('should do nothing if staying on a non-ice tile', () => {
            player.position = { x: 5, y: 5 };
            player.inventory = [];
            wasOnIceTile = false;

            wasOnIceTile = gameManagerService.adaptSpecsForIceTileMove(player, game2.id, wasOnIceTile);

            expect(player.specs.attack).toBe(specs.attack);
            expect(player.specs.defense).toBe(specs.defense);
            expect(wasOnIceTile).toBe(false);
        });
    });

    describe('isGameResumable', () => {
        it('should return true if there is at least one active player', () => {
            game2.players[0].isActive = true;

            const result = gameManagerService.isGameResumable(game2.id);

            expect(result).toBe(true);
        });

        it('should return false if all players are inactive', () => {
            game2.players.forEach((player) => (player.isActive = false));

            const result = gameManagerService.isGameResumable(game2.id);

            expect(result).toBe(false);
        });

        it('should return false if there are no players in the game', () => {
            game2.players = [];

            const result = gameManagerService.isGameResumable(game2.id);

            expect(result).toBe(false);
        });
    });

    describe('checkForWinnerCtf', () => {
        it('should return true if the player has the flag and is at their initial position', () => {
            player.inventory = [ItemCategory.Flag];
            player.position = { ...player.initialPosition };
            game2.mode = Mode.Ctf;

            const result = gameManagerService.checkForWinnerCtf(player, game2.id);

            expect(result).toBe(true);
        });

        it('should return false if the player has the flag but is not at their initial position', () => {
            player.inventory = [ItemCategory.Flag];
            player.position = { x: player.initialPosition.x + 1, y: player.initialPosition.y };
            game2.mode = Mode.Ctf;

            const result = gameManagerService.checkForWinnerCtf(player, game2.id);

            expect(result).toBe(false);
        });

        it('should return false if the player does not have the flag', () => {
            player.inventory = [];
            player.position = { ...player.initialPosition };
            game2.mode = Mode.Ctf;

            const result = gameManagerService.checkForWinnerCtf(player, game2.id);

            expect(result).toBe(false);
        });

        it('should return false if the game mode is not CTF', () => {
            player.inventory = [ItemCategory.Flag];
            player.position = { ...player.initialPosition };
            game2.mode = Mode.Classic;

            const result = gameManagerService.checkForWinnerCtf(player, game2.id);

            expect(result).toBe(false);
        });
    });

    describe('GameManagerService - hasPickedUpFlag', () => {
        it('should return true when the old inventory does not contain the flag but the new inventory does', () => {
            const oldInventory: ItemCategory[] = [ItemCategory.Armor, ItemCategory.WallBreaker];
            const newInventory: ItemCategory[] = [ItemCategory.Armor, ItemCategory.WallBreaker, ItemCategory.Flag];

            const result = gameManagerService.hasPickedUpFlag(oldInventory, newInventory);

            expect(result).toBe(true);
        });

        it('should return false when both inventories contain the flag', () => {
            const oldInventory: ItemCategory[] = [ItemCategory.Flag, ItemCategory.Armor];
            const newInventory: ItemCategory[] = [ItemCategory.Flag, ItemCategory.Armor, ItemCategory.WallBreaker];

            const result = gameManagerService.hasPickedUpFlag(oldInventory, newInventory);

            expect(result).toBe(false);
        });
    });

    describe('getFirstFreePosition', () => {
        it('should return the first free position adjacent to the start position', () => {
            const start: Coordinate = { x: 5, y: 5 };
            const game: Game = {
                ...game2,
                players: [{ ...player, position: { x: 6, y: 5 } }],
                tiles: [{ coordinate: { x: 5, y: 6 }, category: TileCategory.Wall }],
                items: [{ coordinate: { x: 4, y: 5 }, category: ItemCategory.Flag }],
            };

            const freePosition = gameManagerService.getFirstFreePosition(start, game);

            expect(freePosition).toEqual({ x: 5, y: 4 });
        });

        it('should return null if there are no free positions adjacent to the start position', () => {
            const start: Coordinate = { x: 5, y: 5 };
            const game: Game = {
                ...game2,
                players: [
                    { ...player, position: { x: 4, y: 5 } },
                    { ...player, position: { x: 6, y: 5 } },
                    { ...player, position: { x: 5, y: 4 } },
                    { ...player, position: { x: 5, y: 6 } },
                ],
                tiles: [
                    { coordinate: { x: 4, y: 4 }, category: TileCategory.Wall },
                    { coordinate: { x: 6, y: 6 }, category: TileCategory.Wall },
                ],
                items: [
                    { coordinate: { x: 4, y: 6 }, category: ItemCategory.Flag },
                    { coordinate: { x: 6, y: 4 }, category: ItemCategory.Flag },
                ],
            };

            const freePosition = gameManagerService.getFirstFreePosition(start, game);

            expect(freePosition).toBeNull();
        });

        it('should not return a position that is a start tile', () => {
            const start: Coordinate = { x: 5, y: 5 };
            const game: Game = {
                ...game2,
                startTiles: [{ coordinate: { x: 5, y: 4 } }],
            };

            const freePosition = gameManagerService.getFirstFreePosition(start, game);

            expect(freePosition).not.toEqual({ x: 5, y: 4 });
        });
    });
    describe('updatePlayerActions', () => {
        it('should decrement the player actions by 1', () => {
            const currentPlayer = game2.players[0];
            currentPlayer.specs.actions = 3;
            gameManagerService.updatePlayerActions('game-1', currentPlayer.socketId);

            expect(currentPlayer.specs.actions).toEqual(2);
        });

        it('should not change actions if the player is not found', () => {
            const initialActions = game2.players[0].specs.actions;
            gameManagerService.updatePlayerActions('game-1', 'Nonexistent Player');

            expect(game2.players[0].specs.actions).toEqual(initialActions);
        });
    });
    describe('getAdjacentWalls', () => {
        it('should return adjacent walls when they are next to the player', () => {
            const wallTile: Tile = { coordinate: { x: 4, y: 5 }, category: TileCategory.Wall };
            game2.tiles = [wallTile];
            player.position = { x: 4, y: 4 };

            const adjacentWalls = gameManagerService.getAdjacentWalls(player, game2.id);

            expect(adjacentWalls).toHaveLength(1);
            expect(adjacentWalls[0]).toEqual(wallTile);
        });

        it('should return an empty array if there are no adjacent walls', () => {
            const wallTile: Tile = { coordinate: { x: 6, y: 6 }, category: TileCategory.Wall };
            game2.tiles = [wallTile];
            player.position = { x: 4, y: 4 };

            const adjacentWalls = gameManagerService.getAdjacentWalls(player, game2.id);

            expect(adjacentWalls).toEqual([]);
        });

        it('should not return walls that are not adjacent to the player', () => {
            game2.tiles = [
                { coordinate: { x: 2, y: 2 }, category: TileCategory.Wall },
                { coordinate: { x: 7, y: 7 }, category: TileCategory.Wall },
            ];
            player.position = { x: 5, y: 5 };

            const adjacentWalls = gameManagerService.getAdjacentWalls(player, game2.id);

            expect(adjacentWalls).toEqual([]);
        });

        it('should not return walls that have adjacent doors', () => {
            const wallTile: Tile = { coordinate: { x: 4, y: 5 }, category: TileCategory.Wall };
            const doorTile: DoorTile = { coordinate: { x: 4, y: 6 }, isOpened: false };
            game2.tiles = [wallTile];
            game2.doorTiles = [doorTile];
            player.position = { x: 4, y: 4 };

            const adjacentWalls = gameManagerService.getAdjacentWalls(player, game2.id);

            expect(adjacentWalls).toEqual([]);
        });
    });
});
