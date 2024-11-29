import { CommonModule } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Character } from '@app/interfaces/character';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { GameCreationEvents } from '@common/events/game-creation.events';
import { Avatar, Bonus, Player } from '@common/game';
import { DetailedMap, Mode } from '@common/map.types';
import { Observable, of, Subject } from 'rxjs';
import { CharacterFormPageComponent } from './character-form-page.component';

const mockCharacters: Character[] = [
    {
        id: Avatar.Avatar1,
        image: './assets/characters/1.png',
        preview: './assets/previewcharacters/1.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar2,
        image: './assets/characters/2.png',
        preview: './assets/previewcharacters/2.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar3,
        image: './assets/characters/3.png',
        preview: './assets/previewcharacters/3.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar4,
        image: './assets/characters/4.png',
        preview: './assets/previewcharacters/4.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar5,
        image: './assets/characters/5.png',
        preview: './assets/previewcharacters/5.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar6,
        image: './assets/characters/6.png',
        preview: './assets/previewcharacters/6.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar7,
        image: './assets/characters/7.png',
        preview: './assets/previewcharacters/7.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar8,
        image: './assets/characters/8.png',
        preview: './assets/previewcharacters/8.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar9,
        image: './assets/characters/9.png',
        preview: './assets/previewcharacters/9.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar10,
        image: './assets/characters/10.png',
        preview: './assets/previewcharacters/10.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar11,
        image: './assets/characters/11.png',
        preview: './assets/previewcharacters/11.png',
        isAvailable: true,
    },
    {
        id: Avatar.Avatar12,
        image: './assets/characters/12.png',
        preview: './assets/previewcharacters/12.png',
        isAvailable: true,
    },
];

const mockMaps: DetailedMap[] = [
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
    let communicationMapServiceSpy: jasmine.SpyObj<CommunicationMapService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let characterServiceSpy: jasmine.SpyObj<CharacterService>;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let availableAvatarsSubject: Subject<any>;

    const mockCharacters: Character[] = [
        { id: Avatar.Avatar1, image: '', preview: '', isAvailable: true },
        { id: Avatar.Avatar2, image: '', preview: '', isAvailable: false },
        { id: Avatar.Avatar3, image: '', preview: '', isAvailable: true },
    ];

    beforeEach(async () => {
        characterServiceSpy = jasmine.createSpyObj('CharacterService', ['getCharacters', 'resetCharacterAvailability']);
        characterServiceSpy.characters = mockCharacters;

        playerServiceSpy = jasmine.createSpyObj('PlayerService', [
            'setPlayer',
            'resetPlayer',
            'setPlayerAvatar',
            'createPlayer',
            'assignBonus',
            'assignDice',
            'setPlayerName',
        ]);
        playerServiceSpy.player = { name: 'Player 1', avatar: Avatar.Avatar1 } as Player;

        routerSpy = jasmine.createSpyObj('Router', ['navigate', 'includes'], { url: 'create-game' });
        communicationMapServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['basicGet']);
        communicationMapServiceSpy.basicGet.and.returnValue(of(mockMaps[0]));
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['listen', 'sendMessage', 'disconnect'], {
            socket: { id: 'host-socket-id' },
        });

        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
            snapshot: { params: { mapName: 'Map1' } },
        });

        availableAvatarsSubject = new Subject<any>();
        socketServiceSpy.listen.and.callFake((eventName: string) => {
            if (eventName === GameCreationEvents.CurrentPlayers) {
                return availableAvatarsSubject.asObservable();
            }
            return of({});
        });

        await TestBed.configureTestingModule({
            imports: [CharacterFormPageComponent, CommonModule, FormsModule],
            providers: [
                { provide: CommunicationMapService, useValue: communicationMapServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
                { provide: CharacterService, useValue: characterServiceSpy },
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: PlayerService, useValue: playerServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterFormPageComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('Character Selection', () => {
        beforeEach(() => {
            characterServiceSpy.characters = [
                { id: Avatar.Avatar1, image: '', preview: '', isAvailable: true },
                { id: Avatar.Avatar2, image: '', preview: '', isAvailable: false },
                { id: Avatar.Avatar3, image: '', preview: '', isAvailable: true },
            ];
            component.selectedCharacter = component.characters[0];
            component.currentIndex = 0;
        });

        it('should cycle to the next available character', () => {
            component.nextCharacter();
            expect(component.selectedCharacter).toEqual(component.characters[2]);
            expect(component.currentIndex).toBe(2);
        });

        it('should wrap around to the first available character if at the end of the list', () => {
            component.currentIndex = 2;
            component.nextCharacter();
            expect(component.selectedCharacter).toEqual(component.characters[0]);
            expect(component.currentIndex).toBe(0);
        });
    });

    describe('Form Submission', () => {
        it('should navigate to waiting room when map is found on creation', async () => {
            component.name = 'Valid Name';
            component.lifeOrSpeedBonus = 'life';
            component.attackOrDefenseBonus = 'attack';
            component.ngOnInit();

            await component.onSubmit();

            expect(routerSpy.navigate).toHaveBeenCalledWith(['Map1/waiting-room/host']);
        });

        it('should show characterNameError if character name is empty', async () => {
            component.name = 'Choisis ton nom';
            playerServiceSpy.player = { name: '', avatar: Avatar.Avatar1 } as Player;
            component.onSubmit();
            await fixture.whenStable();
            expect(component.showCharacterNameError).toBeTrue();
            expect(routerSpy.navigate).not.toHaveBeenCalled();
        });

        it('should show bonusError if lifeOrSpeedBonus is not selected', async () => {
            component.name = 'Valid Name';
            component.attackOrDefenseBonus = 'attack';
            component.onSubmit();
            await fixture.whenStable();
            expect(component.showBonusError).toBeTrue();
            expect(routerSpy.navigate).not.toHaveBeenCalled();
        });

        it('should show diceError if attackOrDefenseBonus is not selected', async () => {
            component.name = 'Valid Name';
            component.lifeOrSpeedBonus = 'life';
            component.onSubmit();
            await fixture.whenStable();
            expect(component.showDiceError).toBeTrue();
            expect(routerSpy.navigate).not.toHaveBeenCalled();
        });
    });

    describe('CharacterForm interactions with playerService', () => {
        beforeEach(() => {
            component.lifeOrSpeedBonus = 'life';
            component.attackOrDefenseBonus = 'attack';
            component.name = 'Player Name';
        });

        describe('addBonus()', () => {
            it('should call assignBonus with the correct lifeOrSpeedBonus', () => {
                component.addBonus('life');
                expect(playerServiceSpy.assignBonus).toHaveBeenCalledWith('life');
            });
        });

        describe('assignDice()', () => {
            it('should call assignDice with the correct attackOrDefenseBonus', () => {
                component.assignDice('attack');
                expect(playerServiceSpy.assignDice).toHaveBeenCalledWith('attack');
            });
        });

        describe('toggleEditing()', () => {
            it('should enable editing mode and call startEditing when isEditing is false', () => {
                component.isEditing = false;
                spyOn(component, 'startEditing');
                component.toggleEditing();
                expect(component.isEditing).toBeTrue();
                expect(component.startEditing).toHaveBeenCalled();
            });

            it('should disable editing mode and call stopEditing when isEditing is true', () => {
                component.isEditing = true;
                spyOn(component, 'stopEditing');
                component.toggleEditing();
                expect(component.isEditing).toBeFalse();
                expect(component.stopEditing).toHaveBeenCalled();
            });
        });

        describe('stopEditing()', () => {
            it('should set the player name if trimmed name is not empty', () => {
                component.name = ' Valid Name ';
                component.stopEditing();
                expect(component.isEditing).toBeFalse();
                expect(playerServiceSpy.setPlayerName).toHaveBeenCalledWith('Valid Name');
            });

            it('should reset name to "Choisis ton nom" if trimmed name is empty', () => {
                component.name = '   ';
                component.stopEditing();
                expect(component.isEditing).toBeFalse();
                expect(component.name).toEqual('Choisis ton nom');
            });
        });

        describe('Getters', () => {
            beforeEach(() => {
                playerServiceSpy.player = {
                    specs: {
                        life: 10,
                        speed: 5,
                        attack: 8,
                        defense: 7,
                        attackBonus: Bonus.D6,
                        defenseBonus: Bonus.D4,
                    },
                } as Player;
            });

            it('should return the correct life value from playerService', () => {
                expect(component.life).toBe(10);
            });

            it('should return the correct speed value from playerService', () => {
                expect(component.speed).toBe(5);
            });

            it('should return the correct attack value from playerService', () => {
                expect(component.attack).toBe(8);
            });

            it('should return the correct defense value from playerService', () => {
                expect(component.defense).toBe(7);
            });

            it('should return the correct attackBonus value from playerService', () => {
                expect(component.attackBonus).toBe(Bonus.D6);
            });

            it('should return the correct defenseBonus value from playerService', () => {
                expect(component.defenseBonus).toBe(Bonus.D4);
            });
        });
    });

    describe('CharacterFormPageComponent additional tests', () => {
        beforeEach(() => {
            characterServiceSpy.characters = [...mockCharacters];
            component.selectedCharacter = component.characters[0];
            component.currentIndex = 0;
            component.name = 'Valid Name';
            component.lifeOrSpeedBonus = 'life';
            component.attackOrDefenseBonus = 'attack';
        });

        describe('Character Selection with selectCharacter', () => {
            it('should select a character if it is available and set the avatar', () => {
                component.selectCharacter(component.characters[2]);
                expect(component.selectedCharacter).toEqual(component.characters[2]);
                expect(playerServiceSpy.setPlayerAvatar).toHaveBeenCalledWith(component.characters[2].id);
            });

            it('should not change selection if character is unavailable', () => {
                const unavailableCharacter = { ...component.characters[1], isAvailable: false };
                component.selectCharacter(unavailableCharacter);
                expect(component.selectedCharacter).toEqual(component.characters[0]);
                expect(playerServiceSpy.setPlayerAvatar).not.toHaveBeenCalled();
            });
        });

        describe('Error handling and navigation on failed map retrieval', () => {
            it('should display selectionError and navigate to /create-game after delay', fakeAsync(() => {
                communicationMapServiceSpy.basicGet.and.returnValue(of(undefined));
                component.onSubmit();
                tick(5000);
                expect(component.showSelectionError).toBeTrue();
                expect(routerSpy.navigate).toHaveBeenCalledWith(['/create-game']);
            }));
        });

        describe('Navigation with onReturn and onQuit', () => {
            it('should navigate to create-game if router url includes "create-game"', () => {
                component.onReturn();
                expect(routerSpy.navigate).toHaveBeenCalledWith(['/create-game']);
            });

            it('should disconnect socket and navigate to main menu on onQuit', () => {
                component.onQuit();
                expect(socketServiceSpy.disconnect).toHaveBeenCalled();
                expect(routerSpy.navigate).toHaveBeenCalledWith(['/main-menu']);
            });
        });
    });
});

describe('CharacterFormPage when joining game', () => {
    let component: CharacterFormPageComponent;
    let fixture: ComponentFixture<CharacterFormPageComponent>;
    let communicationMapServiceSpy: SpyObj<CommunicationMapService>;
    let routerSpy: SpyObj<Router>;
    let activatedRouteSpy: SpyObj<ActivatedRoute>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;
    let characterServiceSpy: jasmine.SpyObj<CharacterService>;
    let availableAvatarsSubject: Subject<Object>;

    beforeEach(async () => {
        characterServiceSpy = jasmine.createSpyObj('CharacterService', ['getCharacters', 'resetCharacterAvailability']);
        characterServiceSpy.characters = mockCharacters;

        communicationMapServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['basicGet']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate', 'includes'], { url: 'join-game' });

        playerServiceSpy = jasmine.createSpyObj('PlayerService', ['getPlayer', 'setPlayer', 'resetPlayer', 'setPlayerAvatar', 'createPlayer']);
        playerServiceSpy.player = { name: 'Player 1', avatar: Avatar.Avatar1 } as Player;

        communicationMapServiceSpy.basicGet.and.returnValue(of(mockMaps[1]));
        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
            snapshot: {
                params: { gameId: '5678' },
            },
        });

        availableAvatarsSubject = new Subject<any>();

        socketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen', 'disconnect'], {
            socket: { id: 'mock-socket-id' },
        });

        socketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
            if (eventName === GameCreationEvents.CurrentPlayers) {
                return availableAvatarsSubject.asObservable() as Observable<T>;
            } else if (eventName === GameCreationEvents.PlayerJoined) {
                return of({
                    name: 'nouveau user',
                    socketId: 'mock-socket-id',
                    isActive: true,
                } as T);
            } else if (eventName === GameCreationEvents.GameAlreadyStarted) {
                return of({} as T);
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
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: PlayerService, useValue: playerServiceSpy },
                { provide: CharacterService, useValue: characterServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterFormPageComponent);
        component = fixture.componentInstance;
    });

    beforeEach(() => {
        component.ngOnInit();
    });

    it('should show an error and navigate to main menu if game has already started', fakeAsync(() => {
        component.listenToGameStatus();
        component.listenToPlayerJoin();

        socketServiceSpy.listen.withArgs(GameCreationEvents.GameAlreadyStarted).and.returnValue(of('Game has already started'));

        tick(5000);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/main-menu']);
    }));

    it('should navigate to main menu if router url does not include "create-game"', () => {
        component.onReturn();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/main-menu']);
    });

    describe('listenToSocketMessages', () => {
        it('should update character availability based on received players', fakeAsync(() => {
            const currentPlayers = [{ avatar: Avatar.Avatar1, name: 'Player 1' } as Player, { avatar: Avatar.Avatar3, name: 'Player 3' } as Player];

            availableAvatarsSubject.next(currentPlayers);
            component.selectedCharacter = mockCharacters[0];
            tick();

            expect(component.selectedCharacter.isAvailable).toBeFalse();
        }));
    });

    describe('CharacterFormPageComponent HostListener keydown', () => {
        it('should navigate to the previous character when ArrowLeft is pressed', () => {
            characterServiceSpy.characters = [...mockCharacters];
            component.selectedCharacter = mockCharacters[2];
            component.currentIndex = 2;

            const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            component.handleKeyDown(event);

            expect(component.selectedCharacter).toEqual(mockCharacters[1]);
            expect(component.currentIndex).toBe(1);
        });

        it('should navigate to the next character when ArrowRight is pressed', () => {
            characterServiceSpy.characters = [...mockCharacters];
            component.selectedCharacter = mockCharacters[0];
            component.currentIndex = 0;

            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            component.handleKeyDown(event);

            expect(component.selectedCharacter).toEqual(mockCharacters[1]);
            expect(component.currentIndex).toBe(1);
        });
    });

    it('should send joinGame message via socket if joining a game', async () => {
        component.name = 'Valid Name';
        component.lifeOrSpeedBonus = 'life';
        component.attackOrDefenseBonus = 'attack';

        component.gameId = '5678';
        await component.onSubmit();

        expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith(GameCreationEvents.JoinGame, { player: playerServiceSpy.player, gameId: '5678' });
    });
});
