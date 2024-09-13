import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapAreaComponent } from './map-area.component';

describe('MapAreaComponent', () => {
  let component: MapAreaComponent;
  let fixture: ComponentFixture<MapAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapAreaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
