import { TestBed } from '@angular/core/testing';
import { ItemCategory, Map, Mode } from '@common/map.types';
import { MapConversionService } from '../map-conversion/map-conversion.service';
import { MapCounterService } from './map-counter.service';

describe('MapCounterService', () => {
    let service: MapCounterService;
    let mapConversionServiceSpy: jasmine.SpyObj<MapConversionService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('MapConversionService', ['getMaxPlayers', 'getNbItems']);
        TestBed.configureTestingModule({
            providers: [MapCounterService, { provide: MapConversionService, useValue: spy }],
        });
        service = TestBed.inject(MapCounterService);
        mapConversionServiceSpy = TestBed.inject(MapConversionService) as jasmine.SpyObj<MapConversionService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should update startingPointCounter when updateCounters is called', () => {
        service.startingPointCounter = 0;
        service.updateCounters(true, 'add');
        expect(service.startingPointCounter).toBe(1);
        service.updateCounters(true, 'remove');
        expect(service.startingPointCounter).toBe(0);
    });

    it('should initialize counters correctly', () => {
        mapConversionServiceSpy.getMaxPlayers.and.returnValue(4);
        mapConversionServiceSpy.getNbItems.and.returnValue(10);

        service.initializeCounters(5, 'ctf');

        expect(service.startingPointCounter).toBe(4);
        expect(service.itemsCounter).toBe(10);
        expect(service.items).toContain(ItemCategory.Flag);
    });

    it('should set available items correctly', () => {
        service.setAvailablesItems();
        expect(service.items).toEqual([
            ItemCategory.Armor,
            ItemCategory.IceSkates,
            ItemCategory.WallBreaker,
            ItemCategory.Sword,
            ItemCategory.Amulet,
            ItemCategory.Flask,
        ]);
    });

    it('should check if item is used correctly', () => {
        service.items = [ItemCategory.Armor, ItemCategory.IceSkates];
        expect(service.isItemUsed(ItemCategory.Armor)).toBe(false);
        expect(service.isItemUsed(ItemCategory.Flask)).toBe(true);
    });

    it('should use item correctly', () => {
        service.items = [ItemCategory.Armor, ItemCategory.IceSkates];
        service.itemsCounter = 2;

        service.useItem(ItemCategory.Armor);

        expect(service.items).not.toContain(ItemCategory.Armor);
        expect(service.itemsCounter).toBe(1);
    });

    it('should release item correctly', () => {
        service.items = [ItemCategory.IceSkates];
        service.itemsCounter = 1;

        service.releaseItem(ItemCategory.Armor);

        expect(service.items).toContain(ItemCategory.Armor);
        expect(service.itemsCounter).toBe(2);
    });
    it('should increase randomItemCounter when releasing a random item', () => {
        service.items = [ItemCategory.IceSkates];
        service.itemsCounter = 1;
        service.randomItemCounter = 0;

        service.releaseItem(ItemCategory.Random);

        expect(service.items).toContain(ItemCategory.Random);
        expect(service.itemsCounter).toBe(2);
        expect(service.randomItemCounter).toBe(1);
    });
    it('should load map counters correctly for a given map', () => {
        const map: Map = {
            items: [
                { category: ItemCategory.Armor, coordinate: { x: 1, y: 1 } },
                { category: ItemCategory.Random, coordinate: { x: 2, y: 2 } },
            ],
            startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 1, y: 1 } }],
            mode: Mode.Ctf,
        } as unknown as Map;

        service.items = [ItemCategory.Armor, ItemCategory.IceSkates, ItemCategory.Random];
        service.startingPointCounter = 2;
        service.itemsCounter = 2;
        service.randomItemCounter = 2;

        service.loadMapCounters(map);

        expect(service.items).toEqual([ItemCategory.IceSkates]);
        expect(service.startingPointCounter).toBe(0);
        expect(service.itemsCounter).toBe(1);
        expect(service.randomItemCounter).toBe(1);
    });

    it('should handle empty map correctly', () => {
        const map: Map = {
            items: [],
            startTiles: [],
            mode: Mode.Ctf,
        } as unknown as Map;

        service.items = [ItemCategory.Armor, ItemCategory.IceSkates];
        service.startingPointCounter = 2;
        service.itemsCounter = 2;
        service.randomItemCounter = 0;

        service.loadMapCounters(map);

        expect(service.items).toEqual([ItemCategory.Armor, ItemCategory.IceSkates]);
        expect(service.startingPointCounter).toBe(2);
        expect(service.itemsCounter).toBe(3); // +1 for ctf mode
        expect(service.randomItemCounter).toBe(0);
    });

    it('should handle map with no starting points correctly', () => {
        const map: Map = {
            items: [{ category: ItemCategory.Armor, coordinate: { x: 1, y: 1 } }],
            startTiles: [],
            mode: Mode.Ctf,
        } as unknown as Map;

        service.items = [ItemCategory.Armor, ItemCategory.IceSkates];
        service.startingPointCounter = 2;
        service.itemsCounter = 2;
        service.randomItemCounter = 0;

        service.loadMapCounters(map);

        expect(service.items).toEqual([ItemCategory.IceSkates]);
        expect(service.startingPointCounter).toBe(2);
        expect(service.itemsCounter).toBe(2);
        expect(service.randomItemCounter).toBe(0);
    });

    it('should handle map with no items correctly', () => {
        const map: Map = {
            items: [],
            startTiles: [{ coordinate: { x: 0, y: 0 } }],
            mode: Mode.Ctf,
        } as unknown as Map;

        service.items = [ItemCategory.Armor, ItemCategory.IceSkates];
        service.startingPointCounter = 2;
        service.itemsCounter = 2;
        service.randomItemCounter = 0;

        service.loadMapCounters(map);

        expect(service.items).toEqual([ItemCategory.Armor, ItemCategory.IceSkates]);
        expect(service.startingPointCounter).toBe(1);
        expect(service.itemsCounter).toBe(3);
        expect(service.randomItemCounter).toBe(0);
    });
});
