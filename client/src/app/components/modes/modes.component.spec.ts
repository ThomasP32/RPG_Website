import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModesComponent } from './modes.component';

describe('ModesComponent', () => {
    let component: ModesComponent;
    let fixture: ComponentFixture<ModesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ModesComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ModesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit the selected mode', () => {
        const mode = 'testMode';
        spyOn(component.modeSelected, 'emit');

        component.selectMode(mode);

        expect(component.selectedMode).toBe(mode);
        expect(component.modeSelected.emit).toHaveBeenCalledWith(mode);
    });
});
