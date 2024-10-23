/* eslint-disable */
import { CommonModule } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Character } from '@app/interfaces/character';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Avatar, Bonus, Player, Specs } from '@common/game';
import { DBMap as Map, Mode } from '@common/map.types';
import { Observable, of, Subject } from 'rxjs';
import { CharacterFormPageComponent } from './character-form-page.component';

const mockCharacters: Character[] = [
    {
        id: Avatar.Avatar1,
        name: 'Alistair Clockhaven',
        image: '../../assets/characters/1.png',
        preview: '../../assets/previewcharacters/1.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar2,
        name: 'Arachnoform',
        image: '../../assets/characters/2.png',
        preview: '../../assets/previewcharacters/2.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar3,
        name: 'Archibald Light',
        image: '../../assets/characters/3.png',
        preview: '../../assets/previewcharacters/3.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar4,
        name: 'Archpriest Mechanohr',
        image: '../../assets/characters/4.png',
        preview: '../../assets/previewcharacters/4.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar5,
        name: 'Cyron Vex',
        image: '../../assets/characters/5.png',
        preview: '../../assets/previewcharacters/5.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar6,
        name: 'Magnus Brassguard',
        image: '../../assets/characters/6.png',
        preview: '../../assets/previewcharacters/6.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar7,
        name: 'Professor Quicksprocket',
        image: '../../assets/characters/7.png',
        preview: '../../assets/previewcharacters/7.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar8,
        name: 'Reginald Gearwhisle',
        image: '../../assets/characters/8.png',
        preview: '../../assets/previewcharacters/8.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar9,
        name: 'Vance Steelstrike',
        image: '../../assets/characters/9.png',
        preview: '../../assets/previewcharacters/9.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar10,
        name: 'Zephyr Gearwind',
        image: '../../assets/characters/10.png',
        preview: '../../assets/previewcharacters/10.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar11,
        name: 'Dr. Veselius',
        image: '../../assets/characters/11.png',
        preview: '../../assets/previewcharacters/11.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar12,
        name: 'Grimmauld Ironfist',
        image: '../../assets/characters/12.png',
        preview: '../../assets/previewcharacters/12.png',
        isAvailable: true,
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
    let communicationMapServiceSpy: SpyObj<CommunicationMapService>;
    let routerSpy: SpyObj<Router>;
    let activatedRouteSpy: SpyObj<ActivatedRoute>;
    let characterServiceSpy: jasmine.SpyObj<CharacterService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let availableAvatarsSubject: Subject<Object>;

    beforeEach(async () => {
        characterServiceSpy = jasmine.createSpyObj('CharacterService', ['getCharacters']);
        characterServiceSpy.getCharacters.and.returnValue(of(mockCharacters));

        routerSpy = jasmine.createSpyObj('Router', ['navigate', 'includes'], { url: 'create-game' });

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

        availableAvatarsSubject = new Subject<any>();

        socketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen'], {
            socket: { id: 'host-socket-id' },
        });

        socketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
            if (eventName === 'currentPlayers') {
                return availableAvatarsSubject.asObservable() as Observable<T>;
            } else {
                return of({} as T);
            }
        });

        await TestBed.configureTestingModule({
            imports: [CharacterFormPageComponent, CommonModule, FormsModule],
            providers: [
                { provide: CommunicationMapService, useValue: communicationMapServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
                { provide: CharacterService, useValue: characterServiceSpy },
                { provide: SocketService, useValue: socketServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterFormPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    beforeEach(() => {
        component.ngOnInit();
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
        expect(component.selectedCharacter).toEqual(mockCharacters[0]);
    });

    it('should select the previous available character', () => {
        mockCharacters.forEach((character) => (character.isAvailable = true));
        mockCharacters[3].isAvailable = false;
        component.characters = [...mockCharacters];
        component.currentIndex = 4;
        component.selectCharacter(mockCharacters[4]);
        component.previousCharacter();
        expect(component.selectedCharacter).toEqual(mockCharacters[2]);
    });

    it('should select the next character', () => {
        mockCharacters.forEach((character) => (character.isAvailable = true));
        component.characters = [...mockCharacters];
        component.currentIndex = 0;
        component.selectCharacter(mockCharacters[0]);
        component.nextCharacter();
        expect(component.selectedCharacter).toEqual(mockCharacters[1]);
    });

    it('should select the last character when selecting previous character from the first', () => {
        mockCharacters.forEach((character) => (character.isAvailable = true));
        component.characters = [...mockCharacters];
        component.currentIndex = 0;
        component.selectCharacter(mockCharacters[0]);
        component.previousCharacter();
        expect(component.selectedCharacter).toEqual(mockCharacters[mockCharacters.length - 1]);
    });

    it('should select the first character when selecting next character from the last', () => {
        mockCharacters.forEach((character) => (character.isAvailable = true));
        component.characters = [...mockCharacters];
        component.currentIndex = mockCharacters.length - 1;
        component.selectCharacter(mockCharacters[mockCharacters.length - 1]);
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
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let availableAvatarsSubject: Subject<Object>;

    beforeEach(async () => {
        communicationMapService = jasmine.createSpyObj('CommunicationMapService', ['basicGet']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate', 'includes'], { url: 'join-game' });

        communicationMapService.basicGet.and.returnValue(of(mockMaps[1]));
        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
            snapshot: {
                params: { gameId: '5678' },
            },
        });

        availableAvatarsSubject = new Subject<any>();

        socketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen'], {
            socket: { id: 'mock-socket-id' },
        });

        socketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
            if (eventName === 'currentPlayers') {
                return availableAvatarsSubject.asObservable() as Observable<T>;
            } else {
                return of({} as T);
            }
        });

        await TestBed.configureTestingModule({
            imports: [CharacterFormPageComponent, CommonModule, FormsModule],
            providers: [
                { provide: CommunicationMapService, useValue: communicationMapService },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
                { provide: SocketService, useValue: socketServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterFormPageComponent);
        component = fixture.componentInstance;
    });

    beforeEach(() => {
        component.ngOnInit();
    });

    it('should handle onSubmit correctly when map is found', async () => {
        component.characterName = 'Nom valide';
        component.lifeOrSpeedBonus = 'life';
        component.attackOrDefenseBonus = 'attack';

        component.onSubmit();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(routerSpy.navigate).toHaveBeenCalledWith([`join-game/${component.gameId}/waiting-room`]);
    });

    describe('listenToSocketMessages', () => {
        it('should update character availability based on received players and select a new character if the current one is unavailable', fakeAsync(() => {
            component.characters = [...mockCharacters];
            component.selectedCharacter = mockCharacters[0];
            component.currentIndex = 0;
            const currentPlayers: Player[] = [
                {
                    avatar: Avatar.Avatar1,
                    name: 'Player 1',
                    isActive: true,
                    socketId: 'socket1',
                    position: { x: 0, y: 0 },
                    specs: {} as Specs,
                    inventory: [],
                    turn: 0,
                },
                {
                    avatar: Avatar.Avatar3,
                    name: 'Player 3',
                    isActive: true,
                    socketId: 'socket3',
                    position: { x: 0, y: 0 },
                    specs: {} as Specs,
                    inventory: [],
                    turn: 0,
                },
            ];
            availableAvatarsSubject.next(currentPlayers);
            component.listenToSocketMessages();
            tick();
            expect(component.characters[0].isAvailable).toBeFalse();
            expect(component.characters[2].isAvailable).toBeFalse();

            expect(component.selectedCharacter).toEqual(mockCharacters[1]);
            expect(component.currentIndex).toBe(1);

            expect(component.characters[1].isAvailable).toBeTrue();
            expect(component.characters[3].isAvailable).toBeTrue();
        }));

        it('should not change selected character if it remains available', fakeAsync(() => {
            component.characters = [...mockCharacters];
            component.selectedCharacter = mockCharacters[1];
            component.currentIndex = 1;

            const currentPlayers: Player[] = [
                {
                    avatar: Avatar.Avatar1,
                    name: 'Player 1',
                    isActive: true,
                    socketId: 'socket1',
                    position: { x: 0, y: 0 },
                    specs: {} as Specs,
                    inventory: [],
                    turn: 0,
                },
                {
                    avatar: Avatar.Avatar3,
                    name: 'Player 3',
                    isActive: true,
                    socketId: 'socket3',
                    position: { x: 0, y: 0 },
                    specs: {} as Specs,
                    inventory: [],
                    turn: 0,
                },
            ];

            availableAvatarsSubject.next(currentPlayers);

            component.listenToSocketMessages();
            tick();

            expect(component.selectedCharacter).toEqual(mockCharacters[1]);
            expect(component.currentIndex).toBe(1);
        }));
    });

    describe('CharacterFormPageComponent HostListener keydown', () => {
        it('should navigate to the previous character when ArrowLeft is pressed', () => {
            component.characters = [...mockCharacters];
            component.selectedCharacter = mockCharacters[2];
            component.currentIndex = 2;

            const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            component.handleKeyDown(event);

            expect(component.selectedCharacter).toEqual(mockCharacters[1]);
            expect(component.currentIndex).toBe(1);
        });

        it('should navigate to the next character when ArrowRight is pressed', () => {
            component.characters = [...mockCharacters];
            component.selectedCharacter = mockCharacters[0];
            component.currentIndex = 0;

            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            component.handleKeyDown(event);

            expect(component.selectedCharacter).toEqual(mockCharacters[1]);
            expect(component.currentIndex).toBe(1);
        });
    });
});
