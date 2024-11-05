import { TestBed } from '@angular/core/testing';
import { Cell } from '@common/map-cell';
import { ItemCategory, TileCategory } from '@common/map.types';
import { MapCounterService } from '../map-counter/map-counter.service';
import { TileService } from './tile.service';

describe('TileService', () => {
    let service: TileService;
    let mapCounterServiceSpy: jasmine.SpyObj<MapCounterService>;

    beforeEach(() => {
        mapCounterServiceSpy = jasmine.createSpyObj('MapCounterService', ['updateCounters']);
        TestBed.configureTestingModule({
            providers: [TileService, { provide: MapCounterService, useValue: mapCounterServiceSpy }],
        });
        service = TestBed.inject(TileService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should place a tile', () => {
        const mockMap: Cell[][] = [
            [
                {
                    tileType: TileCategory.Floor,
                    door: { isOpen: false, isDoor: false },
                    isStartingPoint: false,
                    isHovered: false,
                    isOccupied: false,
                    coordinate: { x: 0, y: 0 },
                },
            ],
        ];
        service.placeTile(mockMap, 0, 0, TileCategory.Wall);
        expect(mockMap[0][0].tileType).toBe(TileCategory.Wall);
    });

    it('should place a tile and update counters if replacing a starting-point', () => {
        const mockMap: Cell[][] = [
            [
                {
                    tileType: TileCategory.Floor,
                    door: { isOpen: false, isDoor: false },
                    isStartingPoint: true,
                    isHovered: false,
                    isOccupied: false,
                    coordinate: { x: 0, y: 0 },
                },
            ],
        ];
        service.placeTile(mockMap, 0, 0, TileCategory.Wall);
        expect(mapCounterServiceSpy.updateCounters).toHaveBeenCalledOnceWith(true, undefined, 'add');
        expect(mockMap[0][0].tileType).toBe(TileCategory.Wall);
        expect(mockMap[0][0].item).toBeUndefined();
    });

    it('should toggle doorState between open and closed', () => {
        const mockMap: Cell[][] = [
            [
                {
                    tileType: TileCategory.Door,
                    door: { isOpen: false, isDoor: true },
                    isStartingPoint: false,
                    isHovered: false,
                    isOccupied: false,
                    coordinate: { x: 0, y: 0 },
                },
            ],
        ];
        service.placeTile(mockMap, 0, 0, TileCategory.Door);
        expect(mockMap[0][0].door.isOpen).toBe(true);
        service.placeTile(mockMap, 0, 0, TileCategory.Door);
        expect(mockMap[0][0].door.isOpen).toBe(false);
    });

    it('should erase a tile', () => {
        const mockMap: Cell[][] = [
            [
                {
                    tileType: TileCategory.Wall,
                    door: { isOpen: false, isDoor: false },
                    isStartingPoint: false,
                    isHovered: false,
                    isOccupied: false,
                    coordinate: { x: 0, y: 0 },
                    item: ItemCategory.Hat,
                },
            ],
        ];
        service.eraseTile(mockMap, 0, 0, TileCategory.Floor);
        expect(mapCounterServiceSpy.updateCounters).toHaveBeenCalledOnceWith(false, ItemCategory.Hat, 'add');
        expect(mockMap[0][0].tileType).toBe(TileCategory.Floor);
        expect(mockMap[0][0].item).toBeUndefined();
    });

    it('should move an item', () => {
        const mockMap: Cell[][] = [
            [
                {
                    tileType: TileCategory.Floor,
                    door: { isOpen: false, isDoor: false },
                    isStartingPoint: false,
                    isHovered: false,
                    isOccupied: false,
                    coordinate: { x: 0, y: 0 },
                    item: ItemCategory.Hat,
                },
            ],
            [
                {
                    tileType: TileCategory.Floor,
                    door: { isOpen: false, isDoor: false },
                    isStartingPoint: false,
                    isHovered: false,
                    isOccupied: false,
                    coordinate: { x: 1, y: 0 },
                },
            ],
        ];
        service.moveItem(mockMap, { rowIndex: 0, colIndex: 0 }, { rowIndex: 1, colIndex: 0 });
        expect(mockMap[0][0].item).toBeUndefined();
        expect(mockMap[1][0].item).toBe(ItemCategory.Hat);
    });

    it('should set an item', () => {
        const mockMap: Cell[][] = [
            [
                {
                    tileType: TileCategory.Floor,
                    door: { isOpen: false, isDoor: false },
                    isStartingPoint: false,
                    isHovered: false,
                    isOccupied: false,
                    coordinate: { x: 0, y: 0 },
                    item: ItemCategory.Hat,
                },
            ],
            [
                {
                    tileType: TileCategory.Floor,
                    door: { isOpen: false, isDoor: false },
                    isStartingPoint: false,
                    isHovered: false,
                    isOccupied: false,
                    coordinate: { x: 1, y: 0 },
                },
            ],
        ];
        service.setItem(mockMap, ItemCategory.Flag, { rowIndex: 1, colIndex: 0 });
        expect(mockMap[1][0].item).toBe(ItemCategory.Flag);
    });

    it('should place a tile and NOT update counters if replacing a tile with another tile', () => {
        const mockMap: Cell[][] = [
            [
                {
                    tileType: TileCategory.Floor,
                    door: { isOpen: false, isDoor: false },
                    isStartingPoint: false,
                    isHovered: false,
                    isOccupied: false,
                    coordinate: { x: 0, y: 0 },
                },
            ],
            [
                {
                    tileType: TileCategory.Wall,
                    door: { isOpen: false, isDoor: false },
                    isStartingPoint: false,
                    isHovered: false,
                    isOccupied: false,
                    coordinate: { x: 1, y: 0 },
                },
            ],
        ];
        service.placeTile(mockMap, 1, 0, TileCategory.Door);
        expect(mapCounterServiceSpy.updateCounters).not.toHaveBeenCalled();
        expect(mockMap[1][0].tileType).toBe(TileCategory.Door);
    });
});
