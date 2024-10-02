import { TestBed } from '@angular/core/testing';

import { MapCounterService } from './map-counter.service';

describe('MapCounterService', () => {
    let service: MapCounterService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MapCounterService);
        service.startingPointCounter = 0;
        service.randomItemCounter = 0;
        service.itemsCounter = 0;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should update starting point counter', () => {
        let counter = 0;
        service.startingPointCounter$.subscribe((value) => (counter = value));

        service.updateCounters('starting-point', 'add');
        expect(counter).toBe(1);

        service.updateCounters('starting-point', 'remove');
        expect(counter).toBe(0);
    });

    it('should update items counter', () => {
        let counter = 0;

        spyOn(service, 'updateCounters').and.callThrough();
        spyOn(service, 'updateStartingPointCounter');

        service.updateCounters('acidgun', 'add');
        expect(counter).toBe(1);

        service.updateCounters('acidgun', 'remove');
        expect(counter).toBe(0);
    });

    it('should not update any counter if item is undefined', () => {
        spyOn(service, 'updateStartingPointCounter');

        service.updateCounters(undefined, 'add');

        expect(service.updateStartingPointCounter).not.toHaveBeenCalled();
    });
});
