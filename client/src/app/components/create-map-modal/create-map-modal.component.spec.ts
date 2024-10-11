/* eslint-disable */
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ModesComponent } from '../modes/modes.component';
import { CreateMapModalComponent } from './create-map-modal.component';

describe('CreateMapModalComponent', () => {
    let component: CreateMapModalComponent;
    let fixture: ComponentFixture<CreateMapModalComponent>;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CreateMapModalComponent, ModesComponent, NgClass, NgForOf, NgIf, RouterTestingModule], // Import ModesComponent ici au lieu de l'ajouter dans les declarations
        }).compileComponents();

        fixture = TestBed.createComponent(CreateMapModalComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should convert size correctly to small', () => {
        component.sizeConversion('small');
        expect(component.mapSize).toBe(10);
        expect(component.nbItems).toBe(2);
    });

    it('should convert size correctly to medium', () => {
        component.sizeConversion('medium');
        expect(component.mapSize).toBe(15);
        expect(component.nbItems).toBe(4);
    });

    it('should convert size correctly to large', () => {
        component.sizeConversion('large');
        expect(component.mapSize).toBe(20);
        expect(component.nbItems).toBe(6);
    });

    it('should throw an error for invalid size', () => {
        expect(() => component.sizeConversion('invalid' as 'small' | 'medium' | 'large')).toThrowError('Invalid size value: invalid');
    });

    it('should update selected mode', () => {
        const newMode = 'ctf';
        component.onModeSelected(newMode);
        expect(component.selectedMode).toBe(newMode);
    });

    it('should render the ModesComponent', () => {
        const modesComponent = fixture.debugElement.query(By.directive(ModesComponent));
        expect(modesComponent).toBeTruthy();
    });

    it('should redirect to edit view with correct parameters', () => {
        spyOn(router, 'navigate');
        component.mapSize = 15;
        component.selectedMode = 'CTF';
        component.redirectToEditView();
        expect(router.navigate).toHaveBeenCalledWith(['/creation/size=15/mode=ctf']);
    });
    // aucun sens
    it('should redirect to edit view without selected mode', () => {
        spyOn(router, 'navigate');
        component.mapSize = 15;
        component.redirectToEditView();
        expect(router.navigate).toHaveBeenCalledWith(['/creation/size=15/mode=undefined']);
    });
    // aucun sens
    it('should redirect to edit view without map size', () => {
        spyOn(router, 'navigate');
        component.selectedMode = 'CTF';
        component.redirectToEditView();
        expect(router.navigate).toHaveBeenCalledWith(['/creation/size=undefined/mode=ctf']);
    });

    it('should return true when game creation is possible', () => {
        component.mapSize = 10;
        component.selectedMode = 'ctf';
        expect(component.canCreateGame()).toBeTrue();
    });

    it('should return false when mapSize is undefined', () => {
        component.selectedMode = 'ctf';
        expect(component.canCreateGame()).toBeFalse();
    });

    it('should return false when selectedMode is undefined', () => {
        component.mapSize = 10;
        expect(component.canCreateGame()).toBeFalse();
    });
});
