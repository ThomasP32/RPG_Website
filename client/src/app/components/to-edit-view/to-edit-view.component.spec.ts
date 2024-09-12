import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToEditViewComponent } from './to-edit-view.component';

describe('ToEditViewComponent', () => {
  let component: ToEditViewComponent;
  let fixture: ComponentFixture<ToEditViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToEditViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToEditViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
