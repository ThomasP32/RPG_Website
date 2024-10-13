/* eslint-disable */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Character } from '@app/interfaces/character';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { DBMap as Map, Mode } from '@common/map.types';
import { of } from 'rxjs';
import { CharacterFormPageComponent } from './character-form-page.component';

const mockCharacters: Character[] = [
    { id: 1, name: 'Alistair Clockhaven', image: '../../assets/characters/1.png', preview: '../../assets/previewcharacters/1.png' },
    { id: 2, name: 'Arachnoform', image: '../../assets/characters/2.png', preview: '../../assets/previewcharacters/2.png' },
    { id: 3, name: 'Archibald Light', image: '../../assets/characters/3.png', preview: '../../assets/previewcharacters/3.png' },
    { id: 4, name: 'Archpriest Mechanohr', image: '../../assets/characters/4.png', preview: '../../assets/previewcharacters/4.png' },
    { id: 5, name: 'Cyron Vex', image: '../../assets/characters/5.png', preview: '../../assets/previewcharacters/5.png' },
    { id: 6, name: 'Magnus Brassguard', image: '../../assets/characters/6.png', preview: '../../assets/previewcharacters/6.png' },
    { id: 7, name: 'Professor Quicksprocket', image: '../../assets/characters/7.png', preview: '../../assets/previewcharacters/7.png' },
    { id: 8, name: 'Reginald Gearwhisle', image: '../../assets/characters/8.png', preview: '../../assets/previewcharacters/8.png' },
    { id: 9, name: 'Vance Steelstrike', image: '../../assets/characters/9.png', preview: '../../assets/previewcharacters/9.png' },
    { id: 10, name: 'Zephyr Gearwind', image: '../../assets/characters/10.png', preview: '../../assets/previewcharacters/10.png' },
    { id: 11, name: 'Dr. Veselius', image: '../../assets/characters/11.png', preview: '../../assets/previewcharacters/11.png' },
    { id: 12, name: 'Grimmauld Ironfist', image: '../../assets/characters/12.png', preview: '../../assets/previewcharacters/12.png' },
];

const mockMaps: Map[] = [
    {
        _id: '1',
        isVisible: true,
        name: 'Map1',
        description: 'Description1',
        imagePreview: '',
        mode: Mode.Ctf,
        mapSize: { x: 1, y: 1 },
        startTiles: [],
        items: [],
        doorTiles: [],
        tiles: [],
        lastModified: new Date(),
    },
    {
        _id: '2',
        isVisible: true,
        name: 'Map2',
        description: 'Description2',
        imagePreview: '',
        mode: Mode.Classic,
        mapSize: { x: 2, y: 2 },
        startTiles: [],
        items: [],
        doorTiles: [],
        tiles: [],
        lastModified: new Date(),
    },
];

import SpyObj = jasmine.SpyObj;

describe('CharacterFormPageComponent', () => {
    let component: CharacterFormPageComponent;
    let fixture: ComponentFixture<CharacterFormPageComponent>;
    let communicationMapService: SpyObj<CommunicationMapService>;
    let routerSpy: SpyObj<Router>;

    beforeEach(async () => {
        communicationMapService = jasmine.createSpyObj('CommunicationMapService', ['basicGet']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        communicationMapService.basicGet.and.returnValue(of(mockMaps[0]));

        await TestBed.configureTestingModule({
            imports: [CharacterFormPageComponent, CommonModule, FormsModule],
            providers: [
                { provide: CommunicationMapService, useValue: communicationMapService },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: { queryParams: of({ name: 'Map1' }) } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterFormPageComponent);
        component = fixture.componentInstance;
    });

    //     it('should create', () => {
    //         expect(component).toBeTruthy();
    //     });

    it('should initialize characters and select the first character', () => {
        expect(component.characters).toEqual(mockCharacters);
        expect(component.selectedCharacter).toEqual(mockCharacters[0]);
    });

    it('should set map name from query params', () => {
        expect(component.mapName).toBe('Map1');
    });

    it('should select a character', () => {
        component.selectCharacter(mockCharacters[0]);
        expect(component.selectedCharacter).toBe(mockCharacters[0]);
    });

    it('should select the previous character', () => {
        component.currentIndex = 1;
        component.previousCharacter();
        expect(component.selectedCharacter).toEqual(mockCharacters[0]);
    });

    it('should select the next character', () => {
        component.currentIndex = 0;
        component.nextCharacter();
        expect(component.selectedCharacter).toEqual(mockCharacters[1]);
    });

    it('should select the last character when selecting previous character from the first', () => {
        component.currentIndex = 0;
        component.previousCharacter();
        expect(component.selectedCharacter).toEqual(mockCharacters[mockCharacters.length - 1]);
    });

    it('should select the first character when selecting next character from the last', () => {
        component.currentIndex = mockCharacters.length - 1;
        component.nextCharacter();
        expect(component.selectedCharacter).toEqual(mockCharacters[0]);
    });

    it('should add life bonus', () => {
        component.lifeOrSpeedBonus = 'life';
        component.addBonus();
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(component.life).toBe(6);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(component.speed).toBe(4);
    });

    it('should add speed bonus', () => {
        component.lifeOrSpeedBonus = 'speed';
        component.addBonus();
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(component.life).toBe(4);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(component.speed).toBe(6);
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

    it('should stop editing and keep character name if it is not empty', () => {
        component.characterName = 'Test Name';
        component.stopEditing();
        expect(component.isEditing).toBeFalse();
        expect(component.characterName).toBe('Test Name');
    });

    it('should handle onSubmit correctly when map is found', fakeAsync(() => {
        communicationMapService.basicGet.and.returnValue(of(mockMaps[0]));
        component.characterName = 'Nom valide';
        component.lifeOrSpeedBonus = 'life';
        component.attackOrDefenseBonus = 'attack';

        component.onSubmit();

        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        tick(5000);
        fixture.detectChanges();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/waiting-room'], { queryParams: { name: mockMaps[0].name } });
    }));

    it('should handle onSubmit correctly when map is not found', fakeAsync(() => {
        communicationMapService.basicGet.and.returnValue(of(undefined));
        component.characterName = 'Nom valide';
        component.lifeOrSpeedBonus = 'life';
        component.attackOrDefenseBonus = 'attack';

        component.onSubmit();

        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        tick(5000);
        fixture.detectChanges();

        expect(component.showErrorMessage.selectionError).toBeTrue();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/create-game']);
    }));

    it('should navigate to create game on return', () => {
        component.onReturn();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/create-game']);
    });

    it('should show characterNameError if character name is empty', fakeAsync(() => {
        communicationMapService.basicGet.and.returnValue(of(mockMaps[0]));
        component.characterName = '';
        component.lifeOrSpeedBonus = 'life';
        component.attackOrDefenseBonus = 'attack';

        component.onSubmit();

        tick(5000);
        fixture.detectChanges();

        expect(component.showErrorMessage.characterNameError).toBeTrue();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));

    it('should show bonusError if lifeOrSpeedBonus is not selected', fakeAsync(() => {
        communicationMapService.basicGet.and.returnValue(of(mockMaps[0]));
        component.characterName = 'Nom valide';
        component.lifeOrSpeedBonus = '';
        component.attackOrDefenseBonus = 'attack';

        component.onSubmit();

        tick(5000);
        fixture.detectChanges();

        expect(component.showErrorMessage.bonusError).toBeTrue();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));

    it('should show diceError if attackOrDefenseBonus is not selected', fakeAsync(() => {
        communicationMapService.basicGet.and.returnValue(of(mockMaps[0]));
        component.characterName = 'Nom valide';
        component.lifeOrSpeedBonus = 'speed';
        component.attackOrDefenseBonus = '';

        component.onSubmit();

        tick(5000);
        fixture.detectChanges();

        expect(component.showErrorMessage.diceError).toBeTrue();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));

    it('should set characterName to default if trimmed characterName is empty', () => {
        component.characterName = '   '; 
        component.stopEditing(); 
    
        expect(component.isEditing).toBeFalse(); 
        expect(component.characterName).toBe('Choisis ton nom'); 
    });
});
