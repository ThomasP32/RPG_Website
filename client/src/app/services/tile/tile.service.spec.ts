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

    it('should convert unknown tile value to Floor', () => {
        const result = service.convertTileValue('unknown');
        expect(result).toBe(TileCategory.Floor);
    });

    it('should toggle starting point and update counters', () => {
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

        service.setStartingPoint(mockMap, 0, 0);
        expect(mockMap[0][0].isStartingPoint).toBe(true);
        expect(mapCounterServiceSpy.updateCounters).toHaveBeenCalledWith(true, undefined, 'remove');

        service.setStartingPoint(mockMap, 0, 0);
        expect(mockMap[0][0].isStartingPoint).toBe(false);
        expect(mapCounterServiceSpy.updateCounters).toHaveBeenCalledWith(true, undefined, 'add');
    });

    it('should handle placing each tile type correctly', () => {
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

        ['wall', 'water', 'ice', 'door'].forEach((tileType) => {
            service.placeTile(mockMap, 0, 0, tileType);
            expect(mockMap[0][0].tileType).toBe(service.convertTileValue(tileType));
        });
    });

    it('should update counters and remove item when placing a wall tile on a cell with an item', () => {
        const mockMap: Cell[][] = [
            [
                {
                    tileType: TileCategory.Floor,
                    door: { isOpen: false, isDoor: false },
                    isStartingPoint: false,
                    isHovered: false,
                    isOccupied: false,
                    coordinate: { x: 0, y: 0 },
                    item: ItemCategory.Flag,
                },
            ],
        ];

        service.placeTile(mockMap, 0, 0, 'wall');
        expect(mapCounterServiceSpy.updateCounters).toHaveBeenCalledWith(true, ItemCategory.Flag, 'add');
        expect(mockMap[0][0].item).toBeUndefined();
    });

    it('should not update counters if no item is present when placing a wall tile', () => {
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

        service.placeTile(mockMap, 0, 0, 'wall');
        expect(mapCounterServiceSpy.updateCounters).not.toHaveBeenCalled();
    });

    it('should update counters and remove starting point when cell is a starting point', () => {
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

        service.placeTile(mockMap, 0, 0, 'wall');
        expect(mapCounterServiceSpy.updateCounters).toHaveBeenCalledWith(true, undefined, 'add');
        expect(mockMap[0][0].isStartingPoint).toBeFalse();
    });

    it('should not update counters if cell is not a starting point', () => {
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

        service.placeTile(mockMap, 0, 0, 'wall');
        expect(mapCounterServiceSpy.updateCounters).not.toHaveBeenCalled();
    });
});
