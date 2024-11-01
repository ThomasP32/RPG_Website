import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisconnectModalComponent } from './disconnect-modal.component';

describe('DisconnectModalComponent', () => {
  let component: DisconnectModalComponent;
  let fixture: ComponentFixture<DisconnectModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisconnectModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisconnectModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
