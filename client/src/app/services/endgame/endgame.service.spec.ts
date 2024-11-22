import { TestBed } from '@angular/core/testing';
import { Game, Player } from '@common/game';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { EndgameService } from './endgame.service';

describe('EndgameService', () => {
    let service: EndgameService;

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
    };

    const mockGame: Game = {
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
        nDoorsManipulated: [],
        duration: 0,
        isLocked: true,
        name: 'game',
        description: 'game description',
        imagePreview: 'image-preview',
    };
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [EndgameService],
        });
        service = TestBed.inject(EndgameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getPlayerTilePercentage', () => {
        it('should calculate correct percentage for player visited tiles', () => {
            const percentage = service.getPlayerTilePercentage(mockPlayer, mockGame);
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
            const percentage = service.gameTilePercentage(mockGame);
            expect(percentage).toBe(1);
        });
    });
});
