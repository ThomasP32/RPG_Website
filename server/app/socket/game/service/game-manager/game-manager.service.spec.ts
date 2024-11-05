import { GameCreationService } from '@app/socket/game/service/game-creation/game-creation.service';
import { GameManagerService } from '@app/socket/game/service/game-manager/game-manager.service';
import { Avatar, Bonus, Game, Player, Specs } from '@common/game';
import { Coordinate, Mode, TileCategory } from '@common/map.types';
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
    nDoorsManipulated: 0,
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

            expect(game2.nTurns).toEqual(1);
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
        it('should stop and add the position to the path if tile weight is 0 and random chance is met', () => {
            const destination: Coordinate = { x: 2, y: 8 };
            game2.players[0].position = { x: 2, y: 7 };
            game2.players[0].specs.movePoints = 10;
            game2.tiles.push({ coordinate: { x: 2, y: 8 }, category: TileCategory.Ice });

            jest.spyOn(global.Math, 'random').mockReturnValue(0.05);

            const result = gameManagerService.getMove(game2.id, game2.players[0].socketId, destination);

            expect(result).toEqual([{ x: 2, y: 7 }]);
        });

        it('should return an empty path if the player is not found', () => {
            const destination: Coordinate = { x: 2, y: 8 };
            const result = gameManagerService.getMove(game2.id, 'Nonexistent Player', destination);

            expect(result).toEqual([]);
        });

        it('should return an empty path if the player is inactive', () => {
            const destination: Coordinate = { x: 2, y: 8 };
            game2.players[0].isActive = false;

            const result = gameManagerService.getMove(game2.id, game2.players[0].socketId, destination);

            expect(result).toEqual([]);
            game2.players[0].isActive = true;
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

    describe('hasFallen', () => {
        it('should return true if the last move does not match the destination', () => {
            const moves: Coordinate[] = [
                { x: 1, y: 1 },
                { x: 2, y: 2 },
            ];
            const destination: Coordinate = { x: 3, y: 3 };

            const result = gameManagerService.hasFallen(moves, destination);

            expect(result).toBe(true);
        });

        it('should return false if the last move matches the destination', () => {
            const moves: Coordinate[] = [
                { x: 1, y: 1 },
                { x: 2, y: 2 },
            ];
            const destination: Coordinate = { x: 2, y: 2 };

            const result = gameManagerService.hasFallen(moves, destination);

            expect(result).toBe(false);
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
            };

            nonAdjacentPlayer = {
                socketId: 'player-3',
                name: 'Player 3',
                avatar: Avatar.Avatar3,
                isActive: true,
                position: { x: 7, y: 7 }, // Positioned non-adjacent to player
                initialPosition: { x: 7, y: 7 },
                specs,
                inventory: [],
                turn: 0,
                visitedTiles: [],
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
                nDoorsManipulated: 0,
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
            // Move adjacentPlayer to a non-adjacent position
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
        it('should return adjacent doors if doors are next to the player', () => {
            const playerPosition = { x: 5, y: 5 };
            game2.players[0].position = playerPosition;

            // Add adjacent door tiles
            game2.doorTiles = [
                { coordinate: { x: 5, y: 4 }, isOpened: false }, // Adjacent above
                { coordinate: { x: 6, y: 5 }, isOpened: true },  // Adjacent right
                { coordinate: { x: 7, y: 7 }, isOpened: false }, // Not adjacent
            ];

            const result = gameManagerService.getAdjacentDoors(game2.players[0], game2.id);

            expect(result).toHaveLength(2);
            expect(result).toContainEqual(game2.doorTiles[0]);
            expect(result).toContainEqual(game2.doorTiles[1]);
        });

        it('should return an empty array if there are no adjacent doors', () => {
            game2.doorTiles = [{ coordinate: { x: 8, y: 8 }, isOpened: false }];
            const result = gameManagerService.getAdjacentDoors(game2.players[0], game2.id);

            expect(result).toEqual([]);
        });

        it('should return only doors within one tile distance', () => {
            const adjacentDoor = { coordinate: { x: 6, y: 5 }, isOpened: true };
            const farDoor = { coordinate: { x: 8, y: 8 }, isOpened: false };

            game2.doorTiles = [adjacentDoor, farDoor];
            game2.players[0].position = { x: 5, y: 5 };

            const result = gameManagerService.getAdjacentDoors(game2.players[0], game2.id);
            expect(result).toEqual([adjacentDoor]);
            expect(result).not.toContainEqual(farDoor);
        });
    });

    describe('isGameResumable', () => {
        it('should return true if there is at least one active player', () => {
            game2.players[0].isActive = true;
            expect(gameManagerService.isGameResumable(game2.id)).toBe(true);
        });

        it('should return false if there are no active players', () => {
            game2.players.forEach((player) => (player.isActive = false));
            expect(gameManagerService.isGameResumable(game2.id)).toBe(false);
        });

        it('should return false if the game has no players', () => {
            game2.players = [];
            expect(gameManagerService.isGameResumable(game2.id)).toBe(false);
        });
    });

    describe('isPlayerOnTile', () => {
        it('should return true if there is a player on the specified tile', () => {
            const tilePosition: Coordinate = { x: 5, y: 5 };
            game2.players[0].position = tilePosition;

            const result = gameManagerService.isPlayerOnTile(game2, tilePosition);
            expect(result).toBe(true);
        });

        it('should return false if no player is on the specified tile', () => {
            const tilePosition: Coordinate = { x: 9, y: 9 };
            game2.players[0].position = { x: 5, y: 5 };

            const result = gameManagerService.isPlayerOnTile(game2, tilePosition);
            expect(result).toBe(false);
        });

        it('should return false if the game has no players', () => {
            const tilePosition: Coordinate = { x: 5, y: 5 };
            game2.players = [];

            const result = gameManagerService.isPlayerOnTile(game2, tilePosition);
            expect(result).toBe(false);
        });
    });
});

