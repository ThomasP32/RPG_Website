import { Renderer2 } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from './map.component';

describe('MapComponent', () => {
    let component: MapComponent;
    let fixture: ComponentFixture<MapComponent>;

    let renderer: Renderer2; // Declare the 'renderer' variable
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MapComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        renderer = TestBed.inject(Renderer2); // Add this line
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should create a map of size 10x10 when size is small', () => {
        component.sizeConversion('small');
        expect(component.map.length).toBe(10);
        expect(component.map[0].length).toBe(10);
    });

    it('should create a map of size 15x15 when size is medium', () => {
        component.sizeConversion('medium');
        expect(component.map.length).toBe(15);
        expect(component.map[0].length).toBe(15);
    });

    it('should create a map of size 20x20 when size is large', () => {
        component.sizeConversion('large');
        expect(component.map.length).toBe(20);
        expect(component.map[0].length).toBe(20);
    });

    it('should set the CSS variable --map-size correctly', () => {
        spyOn(renderer, 'setStyle');
        component.sizeConversion('medium');
        expect(renderer.setStyle).toHaveBeenCalledWith(document.documentElement, '--map-size', '15'); // Change Renderer to renderer
    });
});
