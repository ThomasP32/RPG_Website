import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CharacterService } from '@app/services/character.service';
import { of } from 'rxjs';
import { CreateCharacterComponent } from './create-character.component';

describe('CreateCharacterComponent', () => {
    let component: CreateCharacterComponent;
    let fixture: ComponentFixture<CreateCharacterComponent>;
    let mockCharacterService: jasmine.SpyObj<CharacterService>;
    let mockRouter: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        mockCharacterService = jasmine.createSpyObj('CharacterService', ['getCharacters']);
        mockCharacterService.getCharacters.and.returnValue(of([]));

        mockRouter = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [CreateCharacterComponent],
            providers: [
                { provide: CharacterService, useValue: mockCharacterService },
                { provide: Router, useValue: mockRouter },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CreateCharacterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create CreateCharacterComponent', () => {
        expect(component).toBeTruthy();
    });

    it('should apply life bonus when lifeOrSpeedBonus is life', () => {
        component.lifeOrSpeedBonus = 'life';
        component.addBonus();
        expect(component.life).toBe(6);
        expect(component.speed).toBe(4);
    });

    it('should apply speed bonus when lifeOrSpeedBonus is speed', () => {
        component.lifeOrSpeedBonus = 'speed';
        component.addBonus();
        expect(component.life).toBe(4);
        expect(component.speed).toBe(6);
    });

    it('should reset state when rolling for an attribute', () => {
        component.rollFor('attack');
        expect(component.rollingDiceFor).toBe('attack');
        expect(component.diceRolled).toBe(false);
        expect(component.rolledD4).toBe(false);
        expect(component.diceRollD4).toBe(0);
        expect(component.diceRollD6).toBe(0);
    });

    it('should roll a D4 and update attack when rolling for attack', () => {
        spyOn(component, 'rollDice').and.returnValue(3);
        component.rollFor('attack');
        component.assignD4();
        expect(component.attack).toBe(7);
    });

    it('should roll a D6 and update defense when rolling for defense', () => {
        spyOn(component, 'rollDice').and.returnValue(5);
        component.rollFor('defense');
        component.assignD6();
        expect(component.defense).toBe(9);
    });

    it('should navigate to waiting-room on submit', () => {
        component.onSubmit();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/waiting-room']);
    });

    it('should roll dice within valid range', () => {
        for (let i = 0; i < 100; i++) {
            const rollD4 = component.rollDice(4);
            const rollD6 = component.rollDice(6);
            expect(rollD4).toBeGreaterThanOrEqual(1);
            expect(rollD4).toBeLessThanOrEqual(4);
            expect(rollD6).toBeGreaterThanOrEqual(1);
            expect(rollD6).toBeLessThanOrEqual(6);
        }
    });
});
