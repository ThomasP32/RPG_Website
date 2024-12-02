import { TestBed } from '@angular/core/testing';
import { ProfileType } from '@common/constants';
import { Game, GameCtf, Player } from '@common/game';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { GameService } from '../game/game.service';
import { EndgameService } from './endgame.service';

describe('EndgameService', () => {
    let service: EndgameService;
    let gameService: GameService;
    const mockPlayer: Player = {
        socketId: 'player-socket-id',
        name: 'Player1',
        avatar: 1,
        isActive: true,
        specs: {
            evasions: 2,
            life: 100,
            speed: 10,
            attack: 15,
            defense: 10,
            attackBonus: 4,
            defenseBonus: 4,
            movePoints: 5,
            actions: 2,
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
            nEvasions: 0,
            nLifeTaken: 0,
            nLifeLost: 0,
            nItemsUsed: 0,
        },
        inventory: [],
        position: { x: 0, y: 0 },
        initialPosition: { x: 0, y: 0 },
        turn: 0,
        visitedTiles: [{ x: 0, y: 0 }],
        profile: ProfileType.NORMAL,
    };
    const mockPlayer2: Player = {
        socketId: 'player-socket-id',
        name: 'Player2',
        avatar: 1,
        isActive: true,
        specs: {
            evasions: 2,
            life: 100,
            speed: 10,
            attack: 15,
            defense: 10,
            attackBonus: 4,
            defenseBonus: 4,
            movePoints: 5,
            actions: 2,
            nVictories: 1,
            nDefeats: 1,
            nCombats: 10,
            nEvasions: 1,
            nLifeTaken: 1,
            nLifeLost: 1,
            nItemsUsed: 1,
        },
        inventory: [],
        position: { x: 0, y: 0 },
        initialPosition: { x: 0, y: 0 },
        turn: 0,
        visitedTiles: [{ x: 0, y: 0 }],
        profile: ProfileType.NORMAL,
    };

    const mockGameCtf: GameCtf = {
        id: 'test-game-id',
        hostSocketId: 'test-socket',
        hasStarted: true,
        currentTurn: 0,
        mapSize: { x: 10, y: 10 },
        tiles: [
            { coordinate: { x: 2, y: 2 }, category: TileCategory.Water },
            { coordinate: { x: 3, y: 3 }, category: TileCategory.Ice },
            { coordinate: { x: 4, y: 4 }, category: TileCategory.Wall },
        ],
        doorTiles: [
            { coordinate: { x: 1, y: 2 }, isOpened: false },
            { coordinate: { x: 2, y: 1 }, isOpened: true },
        ],
        startTiles: [{ coordinate: { x: 0, y: 0 } }],
        items: [{ coordinate: { x: 0, y: 1 }, category: ItemCategory.Armor }],
        players: [mockPlayer, mockPlayer2],
        mode: Mode.Ctf,
        nPlayersCtf: [mockPlayer, mockPlayer2],
        nTurns: 0,
        debug: false,
        nDoorsManipulated: [{ x: 1, y: 2 }],
        duration: 0,
        isLocked: true,
        name: 'game',
        description: 'game description',
        imagePreview: 'image-preview',
    };

    const mockGameDoor: Game = {
        id: 'test-game-id',
        hostSocketId: 'test-socket',
        hasStarted: true,
        currentTurn: 0,
        mapSize: { x: 10, y: 10 },
        tiles: [
            { coordinate: { x: 2, y: 2 }, category: TileCategory.Water },
            { coordinate: { x: 3, y: 3 }, category: TileCategory.Ice },
            { coordinate: { x: 4, y: 4 }, category: TileCategory.Wall },
        ],
        doorTiles: [
            { coordinate: { x: 1, y: 2 }, isOpened: false },
            { coordinate: { x: 2, y: 1 }, isOpened: true },
        ],
        startTiles: [{ coordinate: { x: 0, y: 0 } }],
        items: [{ coordinate: { x: 0, y: 1 }, category: ItemCategory.Armor }],
        players: [mockPlayer],
        mode: Mode.Classic,
        nTurns: 0,
        debug: false,
        nDoorsManipulated: [{ x: 1, y: 2 }],
        duration: 0,
        isLocked: true,
        name: 'game',
        description: 'game description',
        imagePreview: 'image-preview',
    };
    const mockGameNoDoor: Game = {
        id: 'test-game-id-no-door',
        hostSocketId: 'test-socket',
        hasStarted: true,
        currentTurn: 0,
        mapSize: { x: 10, y: 10 },
        tiles: [
            { coordinate: { x: 2, y: 2 }, category: TileCategory.Water },
            { coordinate: { x: 3, y: 3 }, category: TileCategory.Ice },
            { coordinate: { x: 4, y: 4 }, category: TileCategory.Wall },
        ],
        doorTiles: [],
        startTiles: [{ coordinate: { x: 0, y: 0 } }],
        items: [{ coordinate: { x: 0, y: 1 }, category: ItemCategory.Armor }],
        players: [mockPlayer],
        mode: Mode.Classic,
        nTurns: 0,
        debug: false,
        nDoorsManipulated: [],
        duration: 0,
        isLocked: true,
        name: 'game',
        description: 'game description',
        imagePreview: 'image-preview',
    };
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [EndgameService, GameService],
        });
        service = TestBed.inject(EndgameService);
        gameService = TestBed.inject(GameService);
        gameService.game = { ...mockGameCtf };
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getPlayerTilePercentage', () => {
        it('should calculate correct percentage for player visited tiles', () => {
            const percentage = service.getPlayerTilePercentage(mockPlayer, mockGameDoor);
            expect(percentage).toBe(1);
        });
    });

    describe('gameDurationInMinutes', () => {
        it('should format duration less than 1 minute', () => {
            expect(service.gameDurationInMinutes(45)).toBe('00:45');
        });

        it('should format duration with single-digit seconds', () => {
            expect(service.gameDurationInMinutes(65)).toBe('01:05');
        });

        it('should format duration with multiple minutes', () => {
            expect(service.gameDurationInMinutes(185)).toBe('03:05');
        });

        it('should format duration with zero seconds', () => {
            expect(service.gameDurationInMinutes(120)).toBe('02:00');
        });

        it('should handle zero duration', () => {
            expect(service.gameDurationInMinutes(0)).toBe('00:00');
        });
    });

    describe('gameTilePercentage', () => {
        it('should calculate percentage of unique tiles visited by all players', () => {
            const percentage = service.gameTilePercentage(mockGameDoor);
            expect(percentage).toBe(1);
        });
    });

    describe('gameDoorPercentage', () => {
        it('should calculate percentage of doors opened', () => {
            const percentage = service.gameDoorPercentage(mockGameDoor);
            expect(percentage).toBe(50);
        });
        it('should return 0 if no doors', () => {
            const percentage = service.gameDoorPercentage(mockGameNoDoor);
            expect(percentage).toBe(0);
        });
    });

    describe('getFlagPickupPlayers', () => {
        it('should return number of unique players who picked up flag', () => {
            const players = service.getFlagPickupPlayers(mockGameCtf);
            expect(players).toBe(1);
        });

        it('sortCombats should toggle sorting of players by number of combats', () => {
            service.sortCombats();
            expect(gameService.game.players[0].specs.nCombats).toBe(10);
            expect(service.sortColumn).toBe(4);

            service.sortCombats();
            expect(gameService.game.players[0].specs.nCombats).toBe(0);
        });

        it('sortEvasions should toggle sorting of players by number of evasions', () => {
            service.sortEvasions();
            expect(gameService.game.players[0].specs.nEvasions).toBe(1);
            expect(service.sortColumn).toBe(5);

            service.sortEvasions();
            expect(gameService.game.players[0].specs.nEvasions).toBe(0);
        });

        it('sortVictories should toggle sorting of players by number of victories', () => {
            service.sortVictories();
            expect(gameService.game.players[0].specs.nVictories).toBe(1);
            expect(service.sortColumn).toBe(6);

            service.sortVictories();
            expect(gameService.game.players[0].specs.nVictories).toBe(0);
        });

        it('sortDefeats should toggle sorting of players by number of defeats', () => {
            service.sortDefeats();
            expect(gameService.game.players[0].specs.nDefeats).toBe(1);
            expect(service.sortColumn).toBe(7);

            service.sortDefeats();
            expect(gameService.game.players[0].specs.nDefeats).toBe(0);
        });

        it('sortLostLife should toggle sorting of players by life lost', () => {
            service.sortLostLife();
            expect(gameService.game.players[0].specs.nLifeLost).toBe(1);
            expect(service.sortColumn).toBe(8);

            service.sortLostLife();
            expect(gameService.game.players[0].specs.nLifeLost).toBe(0);
        });

        it('sortStolenLife should toggle sorting of players by life taken', () => {
            service.sortStolenLife();
            expect(gameService.game.players[0].specs.nLifeTaken).toBe(1);
            expect(service.sortColumn).toBe(9);

            service.sortStolenLife();
            expect(gameService.game.players[0].specs.nLifeTaken).toBe(0);
        });

        it('sortObjects should toggle sorting of players by items used', () => {
            service.sortObjects();
            expect(gameService.game.players[0].specs.nItemsUsed).toBe(1);
            expect(service.sortColumn).toBe(10);

            service.sortObjects();
            expect(gameService.game.players[0].specs.nItemsUsed).toBe(0);
        });

        it('sortVisitedTiles should toggle sorting of players by visited tiles', () => {
            service.sortVisitedTiles();
            expect(gameService.game.players[0].visitedTiles.length).toBe(1);
            expect(service.sortColumn).toBe(11);

            service.sortVisitedTiles();
            expect(gameService.game.players[0].visitedTiles.length).toBe(1);
        });
    });
});
