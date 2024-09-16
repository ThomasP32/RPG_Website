import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartGamePageComponent } from './start-game-page.component';

describe('StartGamePageComponent', () => {
  let component: StartGamePageComponent;
  let fixture: ComponentFixture<StartGamePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartGamePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StartGamePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
