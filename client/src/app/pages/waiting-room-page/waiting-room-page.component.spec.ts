import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Avatar, Bonus, Player } from '@common/game';
import { ItemCategory } from '@common/map.types';
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
    },
    inventory: [ItemCategory.Hat, ItemCategory.Key],
    position: { x: 1, y: 2 },
    turn: 1,
    visitedTiles: [],
};

// const mockMap: Map = {
//     name: 'Map1',
//     description: 'This is a mock map',
//     imagePreview: 'mock-image.png',
//     mode: Mode.Classic,
//     mapSize: { x: 10, y: 10 },
//     startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 9, y: 9 } }],
//     items: [
//         { coordinate: { x: 5, y: 5 }, category: ItemCategory.Flag },
//         { coordinate: { x: 7, y: 2 }, category: ItemCategory.Acidgun },
//     ],
//     doorTiles: [
//         { coordinate: { x: 3, y: 3 }, isOpened: false },
//         { coordinate: { x: 6, y: 6 }, isOpened: true },
//     ],
//     tiles: [
//         { coordinate: { x: 0, y: 1 }, category: TileCategory.Wall },
//         { coordinate: { x: 2, y: 3 }, category: TileCategory.Water },
//     ],
// };

describe('WaitingRoomPageComponent when creating a game', () => {
    let component: WaitingRoomPageComponent;
    let fixture: ComponentFixture<WaitingRoomPageComponent>;
    let ActivatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let RouterSpy: jasmine.SpyObj<Router>;
    let SocketServiceSpy: jasmine.SpyObj<SocketService>;
    let CommunicationMapServiceSpy: jasmine.SpyObj<CommunicationMapService>;
    let gameStartedSubject: Subject<Object>;
    let playerJoinedSubject: Subject<Object>;

    beforeEach(async () => {
        Object.defineProperty(window, 'history', {
            value: {
                state: {
                    player: mockPlayer,
                },
                writable: true,
            },
        });
        RouterSpy = jasmine.createSpyObj('Router', ['navigate', 'url', 'history'], {
            url: 'create-game',
        });

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
        ActivatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], { snapshot: { params: { mapName: 'Map1' } } });

        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, WaitingRoomPageComponent],
            providers: [
                { provide: ActivatedRoute, useValue: ActivatedRouteSpy },
                { provide: Router, useValue: RouterSpy },
                { provide: SocketService, useValue: SocketServiceSpy },
                { provide: CommunicationMapService, useValue: CommunicationMapServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingRoomPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // it('should call generateRandomNumber and createGame on ngOnInit when URL contains host', async () => {
    //     spyOn(component, 'generateRandomNumber').and.callThrough();
    //     spyOn(component, 'createNewGame').and.returnValue(Promise.resolve());

    //     CommunicationMapServiceSpy.basicGet.and.returnValue(of(mockMap));

    //     await component.ngOnInit();

    //     expect(component.generateRandomNumber).toHaveBeenCalled();
    //     expect(component.createNewGame).toHaveBeenCalledWith('Map1');
    // });

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

    // it('should listen for gameStarted', () => {
    //     spyOn(console, 'log');
    //     component.ngOnInit();
    //     gameStartedSubject.next({ game: { id: 'test-game-id' } });
    //     expect(console.log).toHaveBeenCalledWith('You started a new game');
    //     playerJoinedSubject.next({ player: { name: 'Player2' } });
    //     expect(console.log).toHaveBeenCalledWith('A new player joined the game:', { player: { name: 'Player2' } });
    // });

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
    let playerJoinedSubject: Subject<Object>;

    beforeEach(async () => {
        Object.defineProperty(window, 'history', {
            value: {
                state: {
                    player: mockPlayer,
                },
                writable: true,
            },
        });
        RouterSpy = jasmine.createSpyObj('Router', ['navigate'], { url: 'join-game' });

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
            imports: [HttpClientTestingModule, WaitingRoomPageComponent],
            providers: [
                { provide: ActivatedRoute, useValue: ActivatedRouteSpy },
                { provide: Router, useValue: RouterSpy },
                { provide: SocketService, useValue: SocketServiceSpy },
                { provide: CommunicationMapService, useValue: CommunicationMapServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingRoomPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // it('should call joinGame on ngOnInit', async () => {
    //     spyOn(component, 'joinGame').and.callThrough();
    //     await component.ngOnInit();
    //     expect(component.joinGame).toHaveBeenCalled();
    // });

    // it('should join an existing game and send join message via socket', async () => {
    //     await component.joinGame();
    //     expect(SocketServiceSpy.sendMessage).toHaveBeenCalledWith('joinGame', { player: mockPlayer, gameId: '1234' });
    // });

    it('should set mapName if present', () => {
        component.getMapName();
        expect(component.mapName).toBe('Map1');
    });

    // it('should navigate to create-game if mapName is missing', () => {
    //     ActivatedRouteSpy.snapshot.params.mapName = undefined;
    //     component.getMapName();
    //     expect(RouterSpy.navigate).toHaveBeenCalledWith(['/create-game']);
    // });
    it('should disconnect socket and navigate to the main menu when exitGame is called', () => {
        const disconnectSpy = SocketServiceSpy.disconnect.and.callThrough();
        const routerSpy = RouterSpy.navigate;
        component.exitGame();
        expect(disconnectSpy).toHaveBeenCalled();
        expect(routerSpy).toHaveBeenCalledWith(['/main-menu']);
    });
    afterEach(() => {
        playerJoinedSubject.complete();
    });
});
