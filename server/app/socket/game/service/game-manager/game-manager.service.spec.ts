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
            const newPosition: Coordinate[] = [
                { x: 5, y: 5 },
                { x: 5, y: 5 },
            ];
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
            game2.tiles.push({coordinate:{x:2, y:8}, category: TileCategory.Ice})

            jest.spyOn(global.Math, 'random').mockReturnValue(0.05);

            const result = gameManagerService.getMove(game2.id, game2.players[0].socketId, destination);

            expect(result).toEqual([
                { x: 2, y: 7 }
            ]);
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
});
