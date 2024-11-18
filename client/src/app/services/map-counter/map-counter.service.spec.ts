import { TestBed } from '@angular/core/testing';
import { Item, ItemCategory } from '@common/map.types';
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

    it('should load map counters correctly', () => {
        service.itemsCounter = 3;
        service.randomItemCounter = 0;
        service.items = [ItemCategory.Armor, ItemCategory.IceSkates, ItemCategory.Sword];
        const usedItems: Item[] = [
            { category: ItemCategory.Armor, coordinate: { x: 1, y: 3 } },
            { category: ItemCategory.Random, coordinate: { x: 3, y: 1 } },
        ];

        service.loadMapCounters(usedItems);

        expect(service.items).not.toContain(ItemCategory.Armor);
        expect(service.itemsCounter).toBe(1);
    });

    it('should set available items correctly', () => {
        service.setAvailablesItems();
        expect(service.items).toEqual([
            ItemCategory.Armor,
            ItemCategory.IceSkates,
            ItemCategory.GrapplingHook,
            ItemCategory.Sword,
            ItemCategory.TimeTwister,
            ItemCategory.Bomb,
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
});
