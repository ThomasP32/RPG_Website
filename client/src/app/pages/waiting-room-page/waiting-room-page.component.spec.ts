import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitingRoomPageComponent } from './waiting-room-page.component';

describe('WaitingRoomPageComponent', () => {
  let component: WaitingRoomPageComponent;
  let fixture: ComponentFixture<WaitingRoomPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaitingRoomPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaitingRoomPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
