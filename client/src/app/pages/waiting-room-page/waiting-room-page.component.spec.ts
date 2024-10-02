import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitingRoomPageComponent } from './waiting-room-page.component';

const minCode = 1000;
const maxCode = 9999;

describe('WaitingRoomPageComponent', () => {
    let component: WaitingRoomPageComponent;
    let fixture: ComponentFixture<WaitingRoomPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WaitingRoomPageComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingRoomPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call generateRandomNumber on ngOnInit', () => {
        spyOn(component, 'generateRandomNumber');
        component.ngOnInit();
        expect(component.generateRandomNumber).toHaveBeenCalled();
    });

    it('should generate a random number within the specified range', () => {
        component.generateRandomNumber();
        expect(component.waitingRoomCode).toBeGreaterThanOrEqual(minCode);
        expect(component.waitingRoomCode).toBeLessThanOrEqual(maxCode);
    });
});
