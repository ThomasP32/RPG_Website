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
        service.items = [ItemCategory.Hat, ItemCategory.IceSkates, ItemCategory.Key];
        const usedItems: Item[] = [
            { category: ItemCategory.Hat, coordinate: { x: 1, y: 3 } },
            { category: ItemCategory.Random, coordinate: { x: 3, y: 1 } },
        ];

        service.loadMapCounters(usedItems);

        expect(service.items).not.toContain(ItemCategory.Hat);
        expect(service.itemsCounter).toBe(2);
    });

    it('should set available items correctly', () => {
        service.setAvailablesItems();
        expect(service.items).toEqual([
            ItemCategory.Hat,
            ItemCategory.IceSkates,
            ItemCategory.Key,
            ItemCategory.Mask,
            ItemCategory.Armor,
            ItemCategory.Acidgun,
        ]);
    });

    it('should check if item is used correctly', () => {
        service.items = [ItemCategory.Hat, ItemCategory.IceSkates];
        expect(service.isItemUsed(ItemCategory.Hat)).toBe(false);
        expect(service.isItemUsed(ItemCategory.Mask)).toBe(true);
    });

    it('should use item correctly', () => {
        service.items = [ItemCategory.Hat, ItemCategory.IceSkates];
        service.itemsCounter = 2;

        service.useItem(ItemCategory.Hat);

        expect(service.items).not.toContain(ItemCategory.Hat);
        expect(service.itemsCounter).toBe(1);
    });

    it('should release item correctly', () => {
        service.items = [ItemCategory.IceSkates];
        service.itemsCounter = 1;

        service.releaseItem(ItemCategory.Hat);

        expect(service.items).toContain(ItemCategory.Hat);
        expect(service.itemsCounter).toBe(2);
    });
});
