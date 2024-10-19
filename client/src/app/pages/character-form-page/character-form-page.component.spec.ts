/* eslint-disable */
import { CommonModule } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Character } from '@app/interfaces/character';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Avatar, Bonus } from '@common/game';
import { DBMap as Map, Mode } from '@common/map.types';
import { of, Subject } from 'rxjs';
import { CharacterFormPageComponent } from './character-form-page.component';

const mockCharacters: Character[] = [
    {
        avatar: Avatar.Avatar1,
        name: 'Alistair Clockhaven',
        image: '../../assets/characters/1.png',
        preview: '../../assets/previewcharacters/1.png',
        available: true,
    },
    {
        avatar: Avatar.Avatar2,
        name: 'Arachnoform',
        image: '../../assets/characters/2.png',
        preview: '../../assets/previewcharacters/2.png',
        available: true,
    },
    {
        avatar: Avatar.Avatar3,
        name: 'Archibald Light',
        image: '../../assets/characters/3.png',
        preview: '../../assets/previewcharacters/3.png',
        available: true,
    },
    {
        avatar: Avatar.Avatar4,
        name: 'Archpriest Mechanohr',
        image: '../../assets/characters/4.png',
        preview: '../../assets/previewcharacters/4.png',
        available: true,
    },
    {
        avatar: Avatar.Avatar5,
        name: 'Cyron Vex',
        image: '../../assets/characters/5.png',
        preview: '../../assets/previewcharacters/5.png',
        available: true,
    },
    {
        avatar: Avatar.Avatar6,
        name: 'Magnus Brassguard',
        image: '../../assets/characters/6.png',
        preview: '../../assets/previewcharacters/6.png',
        available: true,
    },
    {
        avatar: Avatar.Avatar7,
        name: 'Professor Quicksprocket',
        image: '../../assets/characters/7.png',
        preview: '../../assets/previewcharacters/7.png',
        available: true,
    },
    {
        avatar: Avatar.Avatar8,
        name: 'Reginald Gearwhisle',
        image: '../../assets/characters/8.png',
        preview: '../../assets/previewcharacters/8.png',
        available: true,
    },
    {
        avatar: Avatar.Avatar9,
        name: 'Vance Steelstrike',
        image: '../../assets/characters/9.png',
        preview: '../../assets/previewcharacters/9.png',
        available: true,
    },
    {
        avatar: Avatar.Avatar10,
        name: 'Zephyr Gearwind',
        image: '../../assets/characters/10.png',
        preview: '../../assets/previewcharacters/10.png',
        available: true,
    },
    {
        avatar: Avatar.Avatar11,
        name: 'Dr. Veselius',
        image: '../../assets/characters/11.png',
        preview: '../../assets/previewcharacters/11.png',
        available: true,
    },
    {
        avatar: Avatar.Avatar12,
        name: 'Grimmauld Ironfist',
        image: '../../assets/characters/12.png',
        preview: '../../assets/previewcharacters/12.png',
        available: true,
    },
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
    let characterServiceSpy: jasmine.SpyObj<CharacterService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let communicationMapServiceSpy: jasmine.SpyObj<CommunicationMapService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let avatarSubject: Subject<any>;

    beforeEach(async () => {
        avatarSubject = new Subject<any>();

        communicationMapServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['basicGet']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate', 'includes'], { url: 'create-game' });
        characterServiceSpy = jasmine.createSpyObj('CharacterService', ['getCharacters', 'setDisabledAvatars']);
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['listen', 'sendMessage', 'isSocketAlive']);

        communicationMapServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['basicGet']);
        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
            snapshot: {
                params: { mapName: 'Map1' },
            },
        });

        socketServiceSpy.listen.and.returnValue(avatarSubject.asObservable());
        characterServiceSpy.getCharacters.and.returnValue(of(mockCharacters));
        await TestBed.configureTestingModule({
            imports: [CharacterFormPageComponent, CommonModule, FormsModule],
            providers: [
                { provide: CommunicationMapService, useValue: communicationMapServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterFormPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize characters and select the first available character', () => {
        expect(characterServiceSpy.getCharacters).toHaveBeenCalled();
        expect(component.characters.length).toBe(mockCharacters.length);
        expect(component.selectedCharacter).toEqual(mockCharacters[0]);
    });

    it('should update currentIndex when selecting a character', () => {
        component.selectCharacter(mockCharacters[3]);
        expect(component.currentIndex).toBe(3);
        expect(component.selectedCharacter).toBe(mockCharacters[3]);
    });

    it('should disable characters when receiving avatarsSet event', fakeAsync(() => {
        const disabledAvatars = [Avatar.Avatar3, Avatar.Avatar5];
        avatarSubject.next({ avatars: disabledAvatars });

        tick();
        fixture.detectChanges();

        expect(characterServiceSpy.setDisabledAvatars).toHaveBeenCalledWith(disabledAvatars);
    }));

    it('should cycle to the next available character', () => {
        mockCharacters[1].available = false;

        component.currentIndex = 0;
        component.nextCharacter();
        expect(component.selectedCharacter).toEqual(mockCharacters[2]);
    });

    it('should cycle to the previous available character', () => {
        mockCharacters[1].available = false;
        component.currentIndex = 2;
        component.previousCharacter();
        expect(component.selectedCharacter).toEqual(mockCharacters[0]);
    });

    it('should handle avatarSelected event', fakeAsync(() => {
        const avatar = Avatar.Avatar4;
        avatarSubject.next({ avatar });

        tick();
        fixture.detectChanges();

        expect(socketServiceSpy.listen).toHaveBeenCalledWith('avatarSelected');
    }));

    it('should set map name from query params', () => {
        expect(component.mapName).toBe('Map1');
    });

    it('should select a character', () => {
        component.selectCharacter(mockCharacters[0]);
        expect(component.selectedCharacter).toBe(mockCharacters[0]);
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
        expect(component.attackBonus).toBe(Bonus.D6);
        expect(component.defenseBonus).toBe(Bonus.D4);
    });

    it('should assign defense dice', () => {
        component.attackOrDefenseBonus = 'defense';
        component.assignDice();
        expect(component.attackBonus).toBe(Bonus.D4);
        expect(component.defenseBonus).toBe(Bonus.D6);
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

    it('should navigate to create game on return', () => {
        component.onReturn();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/create-game']);
    });

    it('should show characterNameError if character name is empty', async () => {
        communicationMapServiceSpy.basicGet.and.returnValue(of(mockMaps[0]));
        component.characterName = '';
        component.lifeOrSpeedBonus = 'life';
        component.attackOrDefenseBonus = 'attack';

        component.onSubmit();

        fixture.whenStable();
        fixture.detectChanges();

        expect(component.showErrorMessage.characterNameError).toBeTrue();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should show bonusError if lifeOrSpeedBonus is not selected', async () => {
        communicationMapServiceSpy.basicGet.and.returnValue(of(mockMaps[0]));
        component.characterName = 'Nom valide';
        component.lifeOrSpeedBonus = '';
        component.attackOrDefenseBonus = 'attack';

        component.onSubmit();

        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.showErrorMessage.bonusError).toBeTrue();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should show diceError if attackOrDefenseBonus is not selected', async () => {
        communicationMapServiceSpy.basicGet.and.returnValue(of(mockMaps[0]));
        component.characterName = 'Nom valide';
        component.lifeOrSpeedBonus = 'speed';
        component.attackOrDefenseBonus = '';

        component.onSubmit();

        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.showErrorMessage.diceError).toBeTrue();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should set characterName to default if trimmed characterName is empty', () => {
        component.characterName = '   ';
        component.stopEditing();

        expect(component.isEditing).toBeFalse();
        expect(component.characterName).toBe('Choisis ton nom');
    });

    describe('when creating game', () => {
        it('should handle onSubmit correctly when map is not found', fakeAsync(async () => {
            communicationMapServiceSpy.basicGet.and.returnValue(of(undefined));
            component.characterName = 'Nom valide';
            component.lifeOrSpeedBonus = 'life';
            component.attackOrDefenseBonus = 'attack';

            component.onSubmit();
            tick(5000);

            expect(routerSpy.navigate).toHaveBeenCalledWith(['/create-game']);
        }));

        it('should handle onSubmit correctly when map is found', async () => {
            communicationMapServiceSpy.basicGet.and.returnValue(of(mockMaps[0]));
            component.characterName = 'Nom valide';
            component.lifeOrSpeedBonus = 'life';
            component.attackOrDefenseBonus = 'attack';

            component.onSubmit();
            await fixture.whenStable();
            fixture.detectChanges();
            expect(routerSpy.navigate).toHaveBeenCalledWith([`create-game/${mockMaps[0].name}/waiting-room`], {
                state: { player: jasmine.objectContaining({ name: 'Nom valide', avatar: mockCharacters[0].avatar }) },
            });
        });
    });
});

describe('CharacterFormPage when joining game', () => {
    let component: CharacterFormPageComponent;
    let fixture: ComponentFixture<CharacterFormPageComponent>;
    let communicationMapService: SpyObj<CommunicationMapService>;
    let routerSpy: SpyObj<Router>;
    let activatedRouteSpy: SpyObj<ActivatedRoute>;

    beforeEach(async () => {
        communicationMapService = jasmine.createSpyObj('CommunicationMapService', ['basicGet']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate', 'includes'], { url: 'join-game' });

        communicationMapService.basicGet.and.returnValue(of(mockMaps[1]));
        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
            snapshot: {
                params: { mapName: 'Map2', gameId: '5678' },
            },
        });
        await TestBed.configureTestingModule({
            imports: [CharacterFormPageComponent, CommonModule, FormsModule],
            providers: [
                { provide: CommunicationMapService, useValue: communicationMapService },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterFormPageComponent);
        component = fixture.componentInstance;
    });

    it('should handle onSubmit correctly when map is found', async () => {
        communicationMapService.basicGet.and.returnValue(of(mockMaps[1]));
        component.characterName = 'Nom valide';
        component.lifeOrSpeedBonus = 'life';
        component.attackOrDefenseBonus = 'attack';

        component.onSubmit();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(routerSpy.navigate).toHaveBeenCalledWith([`join-game/${component.gameId}/${mockMaps[1].name}/waiting-room`], {
            state: { player: jasmine.objectContaining({ name: 'Nom valide', avatar: mockCharacters[0].avatar }) },
        });
    });
});
