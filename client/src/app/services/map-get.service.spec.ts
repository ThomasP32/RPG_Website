import { TestBed } from '@angular/core/testing';

import { MapGetService } from './map-get.service';

describe('MapGetService', () => {
  let service: MapGetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapGetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
