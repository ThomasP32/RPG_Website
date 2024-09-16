import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterFormPageComponent } from './character-form-page.component';

describe('CharacterFormPageComponent', () => {
  let component: CharacterFormPageComponent;
  let fixture: ComponentFixture<CharacterFormPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterFormPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterFormPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
