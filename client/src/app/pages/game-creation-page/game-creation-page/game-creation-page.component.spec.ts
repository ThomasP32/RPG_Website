import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameCreationPageComponent } from './game-creation-page.component';

describe('GameCreationPageComponent', () => {
  let component: GameCreationPageComponent;
  let fixture: ComponentFixture<GameCreationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameCreationPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameCreationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
