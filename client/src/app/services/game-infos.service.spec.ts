import { TestBed } from '@angular/core/testing';
import { Game } from '@common/game';
import { Coordinate, GameDescriptions, ItemCategory, TileCategory } from '@common/map.types';
import { GameInfosService } from './game-infos.service';

describe('GameInfosService', () => {
    let service: GameInfosService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameInfosService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
describe('GameInfosService', () => {
    let service: GameInfosService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameInfosService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return correct tile description', () => {
        const position: Coordinate = { x: 1, y: 1 };
        const loadedMap: Game = {
            tiles: [{ coordinate: position, category: TileCategory.Water }],
            items: [],
            doorTiles: [],
            players: [],
        } as unknown as Game;
        const description = service.getTileDescription(position, loadedMap);
        expect(description).toBe(GameDescriptions.WaterTile);
    });

    it('should return correct item description', () => {
        const position: Coordinate = { x: 1, y: 1 };
        const loadedMap: Game = {
            tiles: [],
            items: [{ coordinate: position, category: ItemCategory.WallBreaker }],
            doorTiles: [],
            players: [],
        } as unknown as Game;
        const description = service.getTileDescription(position, loadedMap);
        expect(description).toBe(GameDescriptions.WallBreaker);
    });

    it('should return correct door description', () => {
        const position: Coordinate = { x: 1, y: 1 };
        const loadedMap: Game = {
            tiles: [],
            items: [],
            doorTiles: [{ coordinate: position, isOpened: false }],
            players: [],
        } as unknown as Game;
        const description = service.getTileDescription(position, loadedMap);
        expect(description).toBe(GameDescriptions.ClosedDoor);
    });

    it('should return correct player description', () => {
        const position: Coordinate = { x: 1, y: 1 };
        const loadedMap: Game = {
            tiles: [],
            items: [],
            doorTiles: [],
            players: [{ position, name: 'Player1' }],
        } as unknown as Game;
        const description = service.getTileDescription(position, loadedMap);
        expect(description).toBe('nom du joueur: Player1');
    });

    it('should return default description if no match found', () => {
        const position: Coordinate = { x: 1, y: 1 };
        const loadedMap: Game = {
            tiles: [],
            items: [],
            doorTiles: [],
            players: [],
        } as unknown as Game;
        const description = service.getTileDescription(position, loadedMap);
        expect(description).toBe('Un déplacement sur une tuile de terrain nécessite 1 point de mouvement.');
    });
});
