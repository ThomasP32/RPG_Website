import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { WaitingRoomPageComponent } from '@app/pages/waiting-room-page/waiting-room-page.component';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { WaitingRoomParameters } from '@common/constants';
import { Avatar, Bonus, Player } from '@common/game';
import { ItemCategory } from '@common/map.types';
import { Observable, of, Subject } from 'rxjs';

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
        attackBonus: Bonus.D6,
        defenseBonus: Bonus.D4,
        movePoints: 5,
        actions: 2,
        nVictories: 3,
        nDefeats: 1,
        nCombats: 4,
        nEvasions: 1,
        nLifeTaken: 50,
        nLifeLost: 30,
        evasions: 0,
    },
    inventory: [ItemCategory.Hat, ItemCategory.Key],
    position: { x: 1, y: 2 },
    turn: 1,
    visitedTiles: [],
    initialPosition: { x: 0, y: 0 },
};

describe('WaitingRoomPageComponent', () => {
    let component: WaitingRoomPageComponent;
    let fixture: ComponentFixture<WaitingRoomPageComponent>;
    let ActivatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let RouterSpy: jasmine.SpyObj<Router>;
    let SocketServiceSpy: jasmine.SpyObj<SocketService>;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;
    let characterServiceSpy: jasmine.SpyObj<CharacterService>;
    let CommunicationMapServiceSpy: jasmine.SpyObj<CommunicationMapService>;
    let gameStartedSubject: Subject<Object>;
    let playerJoinedSubject: Subject<Object>;
    let gameLockToggled$: Subject<{ isLocked: boolean }>;
    let playerKicked$: Subject<void>;

    beforeEach(async () => {
        RouterSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/join' });
        playerServiceSpy = jasmine.createSpyObj('PlayerService', ['getPlayer', 'setPlayer', 'resetPlayer']);
        characterServiceSpy = jasmine.createSpyObj('CharacterService', ['getAvatarPreview', 'resetCharacterAvailability']);
        characterServiceSpy.getAvatarPreview.and.returnValue('avatarUrl');
        playerServiceSpy.getPlayer.and.returnValue(mockPlayer);
        RouterSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/waiting-room/host' });

        gameStartedSubject = new Subject<any>();
        playerJoinedSubject = new Subject<any>();

        gameLockToggled$ = new Subject<{ isLocked: boolean }>();
        playerKicked$ = new Subject<void>();

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

        SocketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
            if (eventName === 'gameLockToggled') {
                return gameLockToggled$.asObservable() as Observable<T>;
            }
            return of([] as T);
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

    it('should generate a random number within the specified range', () => {
        const minCode = 1000;
        const maxCode = 9999;
        spyOnProperty(WaitingRoomParameters, 'MIN_CODE', 'get').and.returnValue(minCode);
        spyOnProperty(WaitingRoomParameters, 'MAX_CODE', 'get').and.returnValue(maxCode);
        component.generateRandomNumber();
    });

    it('should navigate to create-game if mapName is missing', () => {
        ActivatedRouteSpy.snapshot.params.mapName = undefined;
        component.getMapName();
        expect(RouterSpy.navigate).toHaveBeenCalledWith(['/create-game']);
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
    
    it('should set isHost to true if route url contains "host"', () => {
        component.ngOnInit();
        expect(component.isHost).toBeTrue();
    });
    
    it('should generate a random waiting room code within the specified range', () => {
        const minCode = 1000;
        const maxCode = 9999;
        spyOnProperty(WaitingRoomParameters, 'MIN_CODE', 'get').and.returnValue(minCode);
        spyOnProperty(WaitingRoomParameters, 'MAX_CODE', 'get').and.returnValue(maxCode);

        component.generateRandomNumber();

        const generatedCode = parseInt(component.waitingRoomCode, 10);
        expect(generatedCode).toBeGreaterThanOrEqual(minCode);
        expect(generatedCode).toBeLessThanOrEqual(maxCode);
    });

    it('should navigate to game page with correct URL on navigateToGamePage', () => {
        component.waitingRoomCode = '1234';
        component.mapName = 'testMap';
        component.navigateToGamePage();

        expect(RouterSpy.navigate).toHaveBeenCalledWith(['/game/1234/testMap'], {
            state: { player: component.player, gameId: '1234' },
        });
    });

    it('should set hover state to true when toggleHover is called with true', () => {
        component.toggleHover(true);
        expect(component.hover).toBeTrue();
    });

    it('should set hover state to false when toggleHover is called with false', () => {
        component.toggleHover(false);
        expect(component.hover).toBeFalse();
    });

    it('should toggle isGameLocked and call sendMessage with correct parameters', () => {
        component.waitingRoomCode = '1234';
        component.isGameLocked = false;
        component.toggleGameLockState();

        expect(component.isGameLocked).toBeTrue();
        expect(SocketServiceSpy.sendMessage).toHaveBeenCalledWith('toggleGameLockState', {
            isLocked: true,
            gameId: '1234',
        });

        component.toggleGameLockState();

        expect(component.isGameLocked).toBeFalse();
        expect(SocketServiceSpy.sendMessage).toHaveBeenCalledWith('toggleGameLockState', {
            isLocked: false,
            gameId: '1234',
        });
    });
    
    afterEach(() => {
        gameStartedSubject.complete();
        playerJoinedSubject.complete();
        gameLockToggled$.complete();
        playerKicked$.complete();
        (SocketServiceSpy.listen as jasmine.Spy).calls.reset();
        if (component.socketSubscription) {
            component.socketSubscription.unsubscribe();
        }
    });
});
