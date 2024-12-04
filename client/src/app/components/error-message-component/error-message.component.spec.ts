import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorMessageComponent } from './error-message.component';

describe('ErrorMessageComponent', () => {
    let component: ErrorMessageComponent;
    let fixture: ComponentFixture<ErrorMessageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ErrorMessageComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ErrorMessageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default values', () => {
        expect(component.message).toBe('');
        expect(component.showModal).toBe(false);
    });

    it('should open modal with message', () => {
        const testMessage = 'Test error message';
        component.open(testMessage);
        expect(component.message).toBe(testMessage);
        expect(component.showModal).toBe(true);
    });

    it('should close modal', () => {
        component.showModal = true;
        component.closeModal();
        expect(component.showModal).toBe(false);
    });
});
