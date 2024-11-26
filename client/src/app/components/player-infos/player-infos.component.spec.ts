import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerInfosComponent } from './player-infos.component';

describe('PlayerInfosComponent', () => {
  let component: PlayerInfosComponent;
  let fixture: ComponentFixture<PlayerInfosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerInfosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerInfosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
