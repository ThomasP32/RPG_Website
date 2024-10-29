import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Avatar, Bonus, Player } from '@common/game';
import { ItemCategory, Map, Mode, TileCategory } from '@common/map.types';
import { Observable, of, Subject } from 'rxjs';
import { WaitingRoomPageComponent } from './waiting-room-page.component';

const minCode = 1000;
const maxCode = 9999;

const mockPlayer: Player = {
    socketId: 'player1-socket-id',
    name: 'Player1',
    avatar: Avatar.Avatar1,
    isActive: true,
    specs: {
        life: 100,
        speed: 10,
        attack: 15,
        defense: 12,
        attackBonus: { diceType: Bonus.D6, currentValue: 0 },
        defenseBonus: { diceType: Bonus.D4, currentValue: 0 },
        movePoints: 5,
        actions: 2,
        nVictories: 3,
        nDefeats: 1,
        nCombats: 4,
        nEvasions: 1,
        nLifeTaken: 50,
        nLifeLost: 30,
    },
    inventory: [ItemCategory.Hat, ItemCategory.Key],
    position: { x: 1, y: 2 },
    turn: 1,
    visitedTiles: [],
};

const mockMap: Map = {
    name: 'Map1',
    description: 'This is a mock map',
    imagePreview: 'mock-image.png',
    mode: Mode.Classic,
    mapSize: { x: 10, y: 10 },
    startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 9, y: 9 } }],
    items: [
        { coordinate: { x: 5, y: 5 }, category: ItemCategory.Flag },
        { coordinate: { x: 7, y: 2 }, category: ItemCategory.Acidgun },
    ],
    doorTiles: [
        { coordinate: { x: 3, y: 3 }, isOpened: false },
        { coordinate: { x: 6, y: 6 }, isOpened: true },
    ],
    tiles: [
        { coordinate: { x: 0, y: 1 }, category: TileCategory.Wall },
        { coordinate: { x: 2, y: 3 }, category: TileCategory.Water },
    ],
};

describe('WaitingRoomPageComponent when creating a game', () => {
    let component: WaitingRoomPageComponent;
    let fixture: ComponentFixture<WaitingRoomPageComponent>;
    let ActivatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let RouterSpy: jasmine.SpyObj<Router>;
    let SocketServiceSpy: jasmine.SpyObj<SocketService>;
    let CommunicationMapServiceSpy: jasmine.SpyObj<CommunicationMapService>;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;
    let characterServiceSpy: jasmine.SpyObj<CharacterService>;
    let gameStartedSubject: Subject<Object>;
    let playerJoinedSubject: Subject<Object>;

    beforeEach(async () => {
        RouterSpy = jasmine.createSpyObj('Router', ['navigate', 'url'], { url: '/host' });
        playerServiceSpy = jasmine.createSpyObj('PlayerService', ['getPlayer', 'setPlayer', 'resetPlayer']);
        playerServiceSpy.getPlayer.and.returnValue(mockPlayer);

        characterServiceSpy = jasmine.createSpyObj('CharacterService', ['getAvatarPreview', 'resetCharacterAvailability']);
        characterServiceSpy.getAvatarPreview.and.returnValue('preview-url');

        gameStartedSubject = new Subject<any>();
        playerJoinedSubject = new Subject<any>();

        SocketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen', 'disconnect']);
        SocketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
            if (eventName === 'gameStarted') {
                return gameStartedSubject.asObservable() as Observable<T>;
            } else if (eventName === 'playerJoined') {
                return playerJoinedSubject.asObservable() as Observable<T>;
            } else {
                return of([] as T);
            }
        });

        CommunicationMapServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['basicGet']);
        CommunicationMapServiceSpy.basicGet.and.returnValue(of(mockMap));
        ActivatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], { snapshot: { params: { mapName: 'Map1' } } });

        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, CommonModule, WaitingRoomPageComponent],
            providers: [
                { provide: ActivatedRoute, useValue: ActivatedRouteSpy },
                { provide: Router, useValue: RouterSpy },
                { provide: SocketService, useValue: SocketServiceSpy },
                { provide: CommunicationMapService, useValue: CommunicationMapServiceSpy },
                { provide: PlayerService, useValue: playerServiceSpy },
                { provide: CharacterService, useValue: characterServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingRoomPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call getPlayer and getAvatarPreview on ngOnInit when creating a game', async () => {
        component.isHost = true;
        await component.ngOnInit();
        expect(playerServiceSpy.getPlayer).toHaveBeenCalled();
        expect(characterServiceSpy.getAvatarPreview).toHaveBeenCalledWith(mockPlayer.avatar);
        expect(component.playerPreview).toBe('preview-url');
        expect(component.playerName).toBe('Player1');
    });

    it('should generate a random number within the specified range', () => {
        component.generateRandomNumber();
        expect(Number(component.waitingRoomCode)).toBeGreaterThanOrEqual(minCode);
        expect(Number(component.waitingRoomCode)).toBeLessThanOrEqual(maxCode);
    });

    it('should navigate to create-game if mapName is missing', () => {
        ActivatedRouteSpy.snapshot.params.mapName = undefined;
        component.getMapName();
        expect(RouterSpy.navigate).toHaveBeenCalledWith(['/create-game']);
    });

    afterEach(() => {
        gameStartedSubject.complete();
        playerJoinedSubject.complete();
    });
});

describe('WaitingRoomPageComponent when joining a game', () => {
    let component: WaitingRoomPageComponent;
    let fixture: ComponentFixture<WaitingRoomPageComponent>;
    let ActivatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let RouterSpy: jasmine.SpyObj<Router>;
    let SocketServiceSpy: jasmine.SpyObj<SocketService>;
    let CommunicationMapServiceSpy: jasmine.SpyObj<CommunicationMapService>;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;
    let characterServiceSpy: jasmine.SpyObj<CharacterService>;
    let playerJoinedSubject: Subject<Object>;

    beforeEach(async () => {
        RouterSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/join' });
        playerServiceSpy = jasmine.createSpyObj('PlayerService', ['getPlayer']);
        playerServiceSpy.getPlayer.and.returnValue(mockPlayer);

        characterServiceSpy = jasmine.createSpyObj('CharacterService', ['getAvatarPreview', 'resetCharacterAvailability']);
        characterServiceSpy.getAvatarPreview.and.returnValue('preview-url');

        playerJoinedSubject = new Subject<any>();
        SocketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen', 'disconnect']);
        SocketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
            if (eventName === 'playerJoined') {
                return playerJoinedSubject.asObservable() as Observable<T>;
            } else {
                return of([] as T);
            }
        });

        CommunicationMapServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['basicGet']);
        ActivatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
            snapshot: { params: { gameId: '1234', mapName: 'Map1' } },
        });

        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, CommonModule, WaitingRoomPageComponent],
            providers: [
                { provide: ActivatedRoute, useValue: ActivatedRouteSpy },
                { provide: Router, useValue: RouterSpy },
                { provide: SocketService, useValue: SocketServiceSpy },
                { provide: CommunicationMapService, useValue: CommunicationMapServiceSpy },
                { provide: PlayerService, useValue: playerServiceSpy },
                { provide: CharacterService, useValue: characterServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingRoomPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call getPlayer and getAvatarPreview on ngOnInit when joining a game', async () => {
        await component.ngOnInit();
        expect(playerServiceSpy.getPlayer).toHaveBeenCalled();
        expect(characterServiceSpy.getAvatarPreview).toHaveBeenCalledWith(mockPlayer.avatar);
        expect(component.playerPreview).toBe('preview-url');
        expect(component.playerName).toBe('Player1');
    });

    it('should set mapName if present', () => {
        component.getMapName();
        expect(component.mapName).toBe('Map1');
    });

    it('should exit the game and navigate to the main menu', () => {
        component.exitGame();
        expect(characterServiceSpy.resetCharacterAvailability).toHaveBeenCalled();
        expect(SocketServiceSpy.disconnect).toHaveBeenCalled();
        expect(RouterSpy.navigate).toHaveBeenCalledWith(['/main-menu']);
    });

    afterEach(() => {
        playerJoinedSubject.complete();
    });
});
