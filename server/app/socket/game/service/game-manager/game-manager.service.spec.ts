import { Avatar, Bonus, Game, Player, Specs } from '@common/game';

import { Mode, TileCategory } from '@common/map.types';
import { Test, TestingModule } from '@nestjs/testing';
import { GameCreationService } from '../game-creation/game-creation.service';
import { GameManagerService } from './game-manager.service';

describe('GameManagerService', () => {
    // let gameManagerService: GameManagerService;
    let gameCreationService: GameCreationService;
    let game: Game;
    let specs: Specs;
    let player: Player;

    beforeEach(async () => {
        const gameCreationServiceStub = {
            getGame: jest.fn(),
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

        // gameManagerService = module.get<GameManagerService>(GameManagerService);
        gameCreationService = module.get<GameCreationService>(GameCreationService);

        specs = {
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

        game = {
            id: 'game-1',
            hostSocketId: 'host-1',
            availableAvatars: [Avatar.Avatar1, Avatar.Avatar2],
            name: 'Test Game',
            description: 'A test game',
            imagePreview: 'some-image-url',
            mapSize: { x: 20, y: 20 },
            tiles: [
                { coordinate: { x: 0, y: 0 }, category: TileCategory.Wall },
                { coordinate: { x: 1, y: 0 }, category: TileCategory.Water },
            ],
            items: [],
            doorTiles: [{ coordinate: { x: 5, y: 0 }, isOpened: false }],
            players: [player],
            currentTurn: 0,
            nTurns: 0,
            nDoorsManipulated: 0,
            visitedTiles: [],
            duration: 0,
            debug: false,
            mode: Mode.Classic,
            startTiles: [{ coordinate: { x: 1, y: 1 } }, { coordinate: { x: 19, y: 19 } }],
        };

        (gameCreationService.getGame as jest.Mock).mockReturnValue(game);
    });

    // it('should return valid horizontal movements for the Right direction', () => {
    //     player.position = { x: 0, y: 0 };
    //     const movements = gameManagerService.getMovement(Direction.Right, player.position, specs, game);
    //     expect(movements).toEqual([
    //         { x: 1, y: 0 },
    //         { x: 2, y: 0 },
    //         { x: 3, y: 0 },
    //     ]);
    // });

    // it('should stop at a wall when moving to the Right', () => {
    //     player.position = { x: 0, y: 0 };
    //     game.tiles.push({ coordinate: { x: 3, y: 0 }, category: TileCategory.Wall });
    //     const movements = gameManagerService.getMovement(Direction.Right, player.position, specs, game);
    //     expect(movements).toEqual([
    //         { x: 1, y: 0 },
    //         { x: 2, y: 0 },
    //     ]);
    // });

    // it('should calculate movement with increased weight for water tiles', () => {
    //     player.position = { x: 0, y: 0 };
    //     game.tiles.push({ coordinate: { x: 1, y: 0 }, category: TileCategory.Water });
    //     const movements = gameManagerService.getMovement(Direction.Right, player.position, specs, game);
    //     expect(movements).toEqual([{ x: 1, y: 0 }]);
    // });

    // it('should stop at a closed door when moving horizontally', () => {
    //     player.position = { x: 0, y: 0 };
    //     game.doorTiles.push({ coordinate: { x: 3, y: 0 }, isOpened: false });
    //     const movements = gameManagerService.getMovement(Direction.Right, player.position, specs, game);
    //     expect(movements).toEqual([
    //         { x: 1, y: 0 },
    //         { x: 2, y: 0 },
    //     ]);
    // });

    // it('should return all possible movements for a player', () => {
    //     player.position = { x: 0, y: 0 };
    //     const movements = gameManagerService.getMovements(game.id, player.name);
    //     expect(movements.length).toBeGreaterThan(0);
    // });
});
