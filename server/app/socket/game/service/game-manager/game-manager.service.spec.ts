import { GameCreationService } from '@app/socket/game/service/game-creation/game-creation.service';
import { GameManagerService } from '@app/socket/game/service/game-manager/game-manager.service';
import { Avatar, Bonus, Game, Player, Specs } from '@common/game';
import { Coordinate, Mode, TileCategory } from '@common/map.types';
import { Test, TestingModule } from '@nestjs/testing';

describe('GameManagerService', () => {
    let gameManagerService: GameManagerService;
    let game2: Game;
    let specs: Specs;
    let player: Player;

    specs = {
        life: 10,
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

    game2 = {
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
        visitedTiles: [],
        duration: 0,
        debug: false,
        mode: Mode.Classic,
        startTiles: [{ coordinate: { x: 1, y: 1 } }, { coordinate: { x: 19, y: 19 } }],
        isLocked: false,
    };

    beforeEach(async () => {
        const gameCreationServiceStub = {
            getGame: jest.fn().mockReturnValue(game2),
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
    });

    describe('updatePosition', () => {
        it('should update the player position', () => {
            const newPosition: Coordinate = { x: 5, y: 5 };

            gameManagerService.updatePosition('game-1', 'Player 1', newPosition);

            expect(game2.players[0].position).toEqual(newPosition);
        });

        it('should not update the position if the player is not found', () => {
            const newPosition: Coordinate = { x: 0, y: 0 };
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
        it('should return empty path if player not found', () => {
            const path = gameManagerService.getMoves(game2.id, 'Nonexistent Player');
            expect(path.length).toBe(0);
        });

        it('should return accessible moves based on move points', () => {
            const moves = gameManagerService.getMoves(game2.id, game2.players[0].name);
            expect(moves).toContainEqual({ x: 0, y: 1 });
            expect(moves).toContainEqual({ x: 1, y: 0 });
            expect(moves.length).toBe(60);
        });

        it('should return only current position for player with no move points', () => {
            const noMovePlayer = { ...player, name: 'joueur sans point de vie', specs: { ...player.specs, speed: 0 } };
            game2.players.push(noMovePlayer);

            const moves = gameManagerService.getMoves(game2.id, noMovePlayer.name);
            expect(moves.length).toBe(1);
        });

        it('should include tiles of different categories (like water, ice)', () => {
            game2.players[0].position = { x: 4, y: 8 };
            const moves = gameManagerService.getMoves(game2.id, game2.players[0].name);
            expect(moves).toContainEqual({ x: 5, y: 8 });
            expect(moves).toContainEqual({ x: 4, y: 7 });
            expect(moves.length).toBe(30);
        });

        it('should not include unreachable wall tiles', () => {
            const moves = gameManagerService.getMoves(game2.id, game2.players[0].name);
            expect(moves).not.toContainEqual({ x: 0, y: 6 });
            expect(moves).not.toContainEqual({ x: 9, y: 6 });
            expect(moves).not.toContainEqual({ x: 6, y: 6 });
        });
    });

    describe('getMove', () => {
        it('should return empty path if player not found', () => {
            const destination: Coordinate = { x: 5, y: 5 };
            const path = gameManagerService.getMove(game2.id, 'Nonexistent Player', destination, true);
            expect(path.length).toBe(0);
        });

        it('should return the shortest path to a destination tile', () => {
            const destination: Coordinate = { x: 2, y: 8 };
            const path = gameManagerService.getMove(game2.id, game2.players[0].name, destination, true);
            expect(path).toContainEqual({ x: 2, y: 8 });
            console.log(path);
            expect(path.length).toBe(5);
        });

        it('should return empty path if destination is unreachable (blocked by wall)', () => {
            const destination: Coordinate = { x: 0, y: 6 };
            const path = gameManagerService.getMove(game2.id, game2.players[0].name, destination, true);
            expect(path.length).toBe(0);
        });

        it('should return empty path if destination is unreachable (blocked by closed door)', () => {
            const destination: Coordinate = { x: 0, y: 0 };
            const path = gameManagerService.getMove(game2.id, game2.players[0].name, destination, true);
            expect(path.length).toBe(0);
        });

        it('should correctly handle crossing through a door if it is opened', () => {
            game2.doorTiles[0].isOpened = true;
            const destination: Coordinate = { x: 6, y: 5 };
            const path = gameManagerService.getMove(game2.id, game2.players[0].name, destination, true);
            expect(path).toContainEqual({ x: 6, y: 5 });
        });

        it('should stop the path when falling into a tile with weight 0 and 10% chance', () => {
            const destination: Coordinate = { x: 2, y: 8 };
            jest.spyOn(global.Math, 'random').mockReturnValue(0.05);
            const result = gameManagerService.getMove(game2.id, game2.players[0].name, destination, false);

            expect(result.length).toBeLessThanOrEqual(5);
            expect(result[result.length - 1]).not.toEqual(destination);
        });

        it('should update the path if a shorter path is found', () => {
            game2.players[0].position = { x: 5, y: 8 }; 

            const destination: Coordinate = { x: 6, y: 9 };
            const path = gameManagerService.getMove(game2.id, game2.players[0].name, destination, false);

            expect(path).toContainEqual({ x: 6, y: 9 });
            expect(path.length).toBe(3);
        });
    });
});
