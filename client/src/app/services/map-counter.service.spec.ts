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
});
