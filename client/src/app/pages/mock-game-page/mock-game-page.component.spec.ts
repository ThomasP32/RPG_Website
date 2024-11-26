import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MockGamePageComponent } from './mock-game-page.component';

describe('MockGamePageComponent', () => {
  let component: MockGamePageComponent;
  let fixture: ComponentFixture<MockGamePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockGamePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MockGamePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
