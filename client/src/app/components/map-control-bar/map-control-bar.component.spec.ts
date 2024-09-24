import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapControlBarComponent } from './map-control-bar.component';

describe('MapControlBarComponent', () => {
  let component: MapControlBarComponent;
  let fixture: ComponentFixture<MapControlBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapControlBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapControlBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
