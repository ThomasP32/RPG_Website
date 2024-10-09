import { TestBed } from '@angular/core/testing';
import { TileCategory } from '@common/map.types';
import { MapCounterService } from './map-counter.service';
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
        const mockMap = [[{ value: 'floor', item: undefined }], [{ value: 'floor', item: undefined }]];
        service.placeTile(mockMap, 0, 0, 'wall');
        expect(mockMap[0][0].value).toBe('wall');
    });

    it('should place a tile and update counters if replacing an item', () => {
        const mockMap = [[{ value: 'floor', item: 'item1' }], [{ value: 'floor', item: undefined }]];
        service.placeTile(mockMap, 0, 0, 'wall');
        expect(mapCounterServiceSpy.updateCounters).toHaveBeenCalledOnceWith('item1', 'add');
        expect(mockMap[0][0].value).toBe('wall');
        expect(mockMap[0][0].item).toBeUndefined();
    });

    it('should erase a tile', () => {
        const mockMap = [[{ value: 'wall', item: 'item1' }], [{ value: 'floor', item: undefined }]];
        service.eraseTile(mockMap, 0, 0, 'floor');
        expect(mapCounterServiceSpy.updateCounters).toHaveBeenCalledOnceWith('item1', 'add');
        expect(mockMap[0][0].value).toBe('floor');
        expect(mockMap[0][0].item).toBeUndefined();
    });

    it('should move an item', () => {
        const mockMap = [[{ value: 'floor', item: 'item1' }], [{ value: 'floor', item: undefined }]];
        service.moveItem(mockMap, { rowIndex: 0, colIndex: 0 }, { rowIndex: 1, colIndex: 0 });
        expect(mockMap[0][0].item).toBeUndefined();
        expect(mockMap[1][0].item).toBe('item1');
    });

    it('should set an item', () => {
        const mockMap = [[{ value: 'floor', item: 'acidgun' }], [{ value: 'floor', item: TileCategory }]];
        service.setItem(mockMap, 'item2', { rowIndex: 1, colIndex: 0 });
        expect(mockMap[1][0].item).toBe('item2');
    });

    it('should place a tile and NOT update counters if replacing a tile with another tile', () => {
        const mockMap = [[{ value: 'floor', item: undefined }], [{ value: 'wall', item: undefined }]];
        service.placeTile(mockMap, 1, 0, 'door');
        expect(mapCounterServiceSpy.updateCounters).not.toHaveBeenCalled();
        expect(mockMap[1][0].value).toBe('door');
        expect(mockMap[1][0].item).toBeUndefined();
    });

    it('should place a tile', () => {
        const mockMap = [[{ value: 'floor', item: undefined }], [{ value: 'floor', item: undefined }]];
        service.placeTile(mockMap, 0, 0, 'wall');
        expect(mockMap[0][0].value).toBe('wall');
    });

    it('should place a tile and update counters if replacing an item with a wall or door', () => {
        const mockMap = [[{ value: 'floor', item: 'item1' }], [{ value: 'floor', item: undefined }]];
        service.placeTile(mockMap, 0, 0, 'wall');
        expect(mapCounterServiceSpy.updateCounters).toHaveBeenCalledOnceWith('item1', 'add');
        expect(mockMap[0][0].value).toBe('wall');
        expect(mockMap[0][0].item).toBeUndefined();
    });

    it('should place a tile and NOT update counters if replacing an item with a tile other than wall or door', () => {
        const mockMap = [[{ value: 'floor', item: 'item1' }], [{ value: 'floor', item: undefined }]];
        service.placeTile(mockMap, 0, 0, 'floor');
        expect(mapCounterServiceSpy.updateCounters).not.toHaveBeenCalled();
        expect(mockMap[0][0].value).toBe('floor');
    });
});
