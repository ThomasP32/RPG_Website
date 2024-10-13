import { TestBed } from '@angular/core/testing';
import { MapCounterService } from './map-counter.service';

describe('MapCounterService', () => {
    let service: MapCounterService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MapCounterService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should add to startingPointCounter when action is "add" and item is "starting-point"', () => {
        service.startingPointCounter = 2;
        spyOn(service, 'updateStartingPointCounter');

        service.updateCounters('starting-point', 'add');

        expect(service.updateStartingPointCounter).toHaveBeenCalledWith(3);
    });

    it('should remove from startingPointCounter when action is "remove" and item is "starting-point"', () => {
        service.startingPointCounter = 2;
        spyOn(service, 'updateStartingPointCounter');

        service.updateCounters('starting-point', 'remove');

        expect(service.updateStartingPointCounter).toHaveBeenCalledWith(1);
    });

    it('should not call updateStartingPointCounter if the item is not "starting-point"', () => {
        spyOn(service, 'updateStartingPointCounter');

        service.updateCounters('some-other-item', 'add');

        expect(service.updateStartingPointCounter).not.toHaveBeenCalled();
    });

    it('should call next on startingPointCounterSource with the correct value', () => {
        const spy = spyOn<any>(service['startingPointCounterSource'], 'next');

        service.updateStartingPointCounter(5);

        expect(spy).toHaveBeenCalledWith(5);
    });
});
