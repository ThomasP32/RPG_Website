import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Character } from '@app/interfaces/character';
import { CharacterService } from '@app/services/character.service';
import { of } from 'rxjs';
import { CharacterFormPageComponent } from './character-form-page.component';

const six = 6;
const four = 4;

describe('CharacterFormPageComponent', () => {
    let component: CharacterFormPageComponent;
    let fixture: ComponentFixture<CharacterFormPageComponent>;

    const mockCharacters: Character[] = [
        { id: 1, name: 'Character 1', image: 'image1', preview: 'preview1' },
        { id: 2, name: 'Character 2', image: 'image2', preview: 'preview2' },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CharacterFormPageComponent],
            providers: [
                {
                    provide: CharacterService,
                    useValue: {
                        getCharacters: () => of(mockCharacters),
                    },
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParams: of({ id: '123' }),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterFormPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize characters and select the first character', () => {
        expect(component.characters.length).toBe(2);
        expect(component.selectedCharacter).toEqual(mockCharacters[0]);
    });

    it('should handle query parameters', () => {
        expect(component.mapId).toBe('123');
    });

    it('should select a character', () => {
        component.selectCharacter(mockCharacters[0]);
        expect(component.selectedCharacter).toBe(mockCharacters[0]);
    });

    it('should select the previous character', () => {
        component.previousCharacter();
        expect(component.selectedCharacter).toEqual(mockCharacters[1]);
    });

    it('should select the next character', () => {
        component.nextCharacter();
        expect(component.selectedCharacter).toEqual(mockCharacters[1]);
    });

    it('should add life bonus', () => {
        component.lifeOrSpeedBonus = 'life';
        component.addBonus();
        expect(component.life).toBe(six);
        expect(component.speed).toBe(four);
    });

    it('should add speed bonus', () => {
        component.lifeOrSpeedBonus = 'speed';
        component.addBonus();
        expect(component.life).toBe(four);
        expect(component.speed).toBe(six);
    });

    it('should assign attack dice', () => {
        component.attackOrDefenseBonus = 'attack';
        component.assignDice();
        expect(component.attackBonus).toBe('D6');
        expect(component.defenseBonus).toBe('D4');
    });

    it('should assign defense dice', () => {
        component.attackOrDefenseBonus = 'defense';
        component.assignDice();
        expect(component.attackBonus).toBe('D4');
        expect(component.defenseBonus).toBe('D6');
    });

    it('should toggle editing mode', () => {
        component.toggleEditing();
        expect(component.isEditing).toBe(true);
        component.toggleEditing();
        expect(component.isEditing).toBe(false);
    });

    it('should stop editing', () => {
        component.isEditing = true;
        component.stopEditing();
        expect(component.isEditing).toBe(false);
    });

    it('should navigate to waiting room on submit', () => {
        const router = TestBed.inject(Router);
        spyOn(router, 'navigate');
        component.onSubmit();
        expect(router.navigate).toHaveBeenCalledWith(['/waiting-room'], { queryParams: { id: '123' } });
    });

    it('should navigate to create game on return', () => {
        const router = TestBed.inject(Router);
        spyOn(router, 'navigate');
        component.onReturn();
        expect(router.navigate).toHaveBeenCalledWith(['/create-game']);
    });
});
