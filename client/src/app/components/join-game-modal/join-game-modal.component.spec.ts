import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinGameModalComponent } from './join-game-modal.component';

describe('JoinGameModalComponent', () => {
  let component: JoinGameModalComponent;
  let fixture: ComponentFixture<JoinGameModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinGameModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoinGameModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
