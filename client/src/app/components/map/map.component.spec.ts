import { NgClass, NgForOf, NgIf } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ModesComponent } from '../modes/modes.component';
import { MapComponent } from './map.component';

describe('MapComponent', () => {
    let component: MapComponent;
    let fixture: ComponentFixture<MapComponent>;

    beforeEach(async () => {
        // Mock the ModesComponent to avoid testing its internal logic
        const mockModesComponent = {
            // Add any necessary properties or methods for interaction, if needed
        };

        await TestBed.configureTestingModule({
            imports: [MapComponent, NgClass, NgForOf, NgIf], // Import MapComponent directly
            providers: [{ provide: ModesComponent, useValue: mockModesComponent }],
        }).compileComponents();

        fixture = TestBed.createComponent(MapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should create a map with the correct size', () => {
        component.sizeConversion('medium');
        expect(component.mapSize).toBe(15);
    });

    it('should convert size correctly', () => {
        spyOn(console, 'log');
        component.sizeConversion('small');
        expect(component.mapSize).toBe(10);
        expect(component.nbItems).toBe(2);

        component.sizeConversion('medium');
        expect(component.mapSize).toBe(15);
        expect(component.nbItems).toBe(4);

        component.sizeConversion('large');
        expect(component.mapSize).toBe(20);
        expect(component.nbItems).toBe(6);
    });

    it('should handle invalid size', () => {
        spyOn(console, 'error');
        component.sizeConversion('invalid' as 'small' | 'medium' | 'large');
    });

    it('should update selected mode', () => {
        spyOn(console, 'log');
        const newMode = 'CTF';
        component.onModeSelected(newMode);
        expect(component.selectedMode).toBe(newMode);
    });

    it('should render the ModesComponent', () => {
        const modesComponent = fixture.debugElement.query(By.directive(ModesComponent));
        expect(modesComponent).toBeTruthy();
    });
});
