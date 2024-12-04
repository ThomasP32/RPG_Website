import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { WaitingRoomPageComponent } from '@app/pages/waiting-room-page/waiting-room-page.component';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { ProfileType, WaitingRoomParameters } from '@common/constants';
import { GameCreationEvents } from '@common/events/game-creation.events';
import { Avatar, Bonus, Game, Player } from '@common/game';
import { DetailedMap, ItemCategory, Mode, TileCategory } from '@common/map.types';
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
        nItemsUsed: 0,
    },
    inventory: [ItemCategory.Armor, ItemCategory.Sword],
    position: { x: 1, y: 2 },
    turn: 1,
    visitedTiles: [],
    initialPosition: { x: 0, y: 0 },
    profile: ProfileType.NORMAL,
};

describe('WaitingRoomPageComponent', () => {
    let component: WaitingRoomPageComponent;
    let fixture: ComponentFixture<WaitingRoomPageComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let ActivatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let RouterSpy: jasmine.SpyObj<Router>;
    let SocketServiceSpy: jasmine.SpyObj<SocketService>;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;
    let characterServiceSpy: jasmine.SpyObj<CharacterService>;
    let CommunicationMapServiceSpy: jasmine.SpyObj<CommunicationMapService>;
    let gameStartedSubject: Subject<Object>;
    let playerJoinedSubject: Subject<Object>;
    let gameLockToggled$: Subject<boolean>;
    let gameInitialized: Subject<Game>;
    let playerKicked$: Subject<void>;

    const mockMap: DetailedMap = {
        _id: '1',
        name: 'Test Map',
        mapSize: { x: 2, y: 2 },
        tiles: [{ coordinate: { x: 0, y: 0 }, category: TileCategory.Wall }],
        doorTiles: [{ coordinate: { x: 1, y: 1 }, isOpened: true }],
        startTiles: [{ coordinate: { x: 0, y: 1 } }],
        items: [{ coordinate: { x: 1, y: 0 }, category: ItemCategory.Flag }],
        mode: Mode.Ctf,
        lastModified: new Date(),
        description: '',
        imagePreview: '',
        isVisible: true,
    };
    beforeEach(async () => {
        RouterSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/join' });
        playerServiceSpy = jasmine.createSpyObj('PlayerService', ['getPlayer', 'setPlayer', 'resetPlayer']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['createNewCtfGame', 'createNewGame', 'setGame']);
        characterServiceSpy = jasmine.createSpyObj('CharacterService', ['getAvatarPreview', 'resetCharacterAvailability']);
        characterServiceSpy.getAvatarPreview.and.returnValue('avatarUrl');
        playerServiceSpy.player = mockPlayer;
        RouterSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/waiting-room/host' });

        gameStartedSubject = new Subject<any>();
        playerJoinedSubject = new Subject<any>();

        gameLockToggled$ = new Subject<boolean>();
        gameInitialized = new Subject<Game>();
        playerKicked$ = new Subject<void>();

        SocketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen', 'disconnect', 'isSocketAlive']);
        SocketServiceSpy.isSocketAlive.and.returnValue(true);

        SocketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
            if (eventName === 'gameStarted') {
                return gameStartedSubject.asObservable() as Observable<T>;
            } else if (eventName === GameCreationEvents.PlayerJoined) {
                return playerJoinedSubject.asObservable() as Observable<T>;
            } else if (eventName === GameCreationEvents.GameInitialized) {
                return gameInitialized.asObservable() as Observable<T>;
            } else if (eventName === GameCreationEvents.GameLockToggled) {
                return gameLockToggled$.asObservable() as Observable<T>;
            } else {
                return of([] as T);
            }
        });

        CommunicationMapServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['basicGet']);
        CommunicationMapServiceSpy.basicGet.and.returnValue(of({}));

        ActivatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
            snapshot: { params: { gameId: '1234', mapName: 'Map1' } },
        });

        gameServiceSpy.createNewGame.and.returnValue({
            id: '1234',
            players: [mockPlayer],
            hostSocketId: 'socket-id',
            currentTurn: 0,
            nDoorsManipulated: [],
            duration: 0,
            nTurns: 0,
            debug: false,
            isLocked: false,
            hasStarted: false,
            name: '',
            description: '',
            imagePreview: '',
            mode: Mode.Classic,
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
        });

        gameServiceSpy.createNewCtfGame.and.returnValue({
            id: '1234',
            players: [mockPlayer],
            hostSocketId: 'socket-id',
            currentTurn: 0,
            nDoorsManipulated: [],
            duration: 0,
            nTurns: 0,
            debug: false,
            isLocked: false,
            hasStarted: false,
            nPlayersCtf: [],
            name: '',
            description: '',
            imagePreview: '',
            mode: Mode.Ctf,
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
        });

        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, CommonModule, WaitingRoomPageComponent],
            providers: [
                { provide: ActivatedRoute, useValue: ActivatedRouteSpy },
                { provide: Router, useValue: RouterSpy },
                { provide: SocketService, useValue: SocketServiceSpy },
                { provide: CommunicationMapService, useValue: CommunicationMapServiceSpy },
                { provide: PlayerService, useValue: playerServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
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

    it('should initialize the game when the gameStarted event is received', () => {
        component.createNewGame(mockMap.name);
        expect(gameServiceSpy.createNewGame).toHaveBeenCalled();
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
        SocketServiceSpy.isSocketAlive.and.returnValue(false);
        component.ngOnInit();
        expect(component.isHost).toBeTrue();
    });

    it('should set isHost to false if route url does not contain "host"', () => {
        RouterSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/waiting-room' });
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
        expect(SocketServiceSpy.sendMessage).toHaveBeenCalledWith(GameCreationEvents.ToggleGameLockState, {
            isLocked: true,
            gameId: '1234',
        });

        component.toggleGameLockState();

        expect(component.isGameLocked).toBeFalse();
        expect(SocketServiceSpy.sendMessage).toHaveBeenCalledWith(GameCreationEvents.ToggleGameLockState, {
            isLocked: false,
            gameId: '1234',
        });
    });

    it('should handle gameLockToggled event correctly and update isGameLocked', () => {
        component.isGameLocked = false;
        gameLockToggled$.next(true);

        fixture.detectChanges();

        expect(component.isGameLocked).toBeTrue();

        gameLockToggled$.next(false);

        fixture.detectChanges();

        expect(component.isGameLocked).toBeFalse();
    });

    it('should handle gameInitialized event correctly and update the game state', () => {
        const mockGame = {
            id: '1234',
            players: [
                mockPlayer,
                {
                    socketId: 'another-socket-id',
                    name: 'Player2',
                    avatar: Avatar.Avatar2,
                    isActive: true,
                    specs: { ...mockPlayer.specs },
                    inventory: [],
                    position: { x: 2, y: 3 },
                    turn: 2,
                    visitedTiles: [],
                    initialPosition: { x: 1, y: 1 },
                },
            ],
            hasStarted: false,
        };

        spyOn(component, 'navigateToGamePage').and.callThrough();

        gameInitialized.next(mockGame as Game);

        fixture.detectChanges();

        expect(playerServiceSpy.setPlayer).toHaveBeenCalledWith(mockPlayer);
        expect(component.gameInitialized).toBeTrue();
        expect(component.navigateToGamePage).toHaveBeenCalled();
    });

    it('should send initializeGame message when startGame is called', () => {
        component.waitingRoomCode = '1234';
        component.startGame();
        expect(SocketServiceSpy.sendMessage).toHaveBeenCalledWith(GameCreationEvents.InitializeGame, '1234');
    });

    it('should handle playerJoined event correctly', () => {
        const mockPlayers = [
            mockPlayer,
            {
                socketId: 'player2-socket-id',
                name: 'Player2',
                avatar: Avatar.Avatar2,
                isActive: true,
                specs: { ...mockPlayer.specs },
                inventory: [],
                position: { x: 2, y: 3 },
                turn: 2,
                visitedTiles: [],
                initialPosition: { x: 1, y: 1 },
                profile: ProfileType.NORMAL,
            },
        ];

        component.isHost = true;
        component.maxPlayers = 2;

        playerJoinedSubject.next(mockPlayers);

        fixture.detectChanges();

        expect(component.activePlayers).toEqual(mockPlayers);
        expect(component.numberOfPlayers).toEqual(mockPlayers.length);
    });

    it('should set showProfileModal to true when openProfileModal is called', () => {
        component.openProfileModal();
        expect(component.showProfileModal).toBeTrue();
    });

    it('should set showProfileModal to false when closeProfileModal is called', () => {
        component.closeProfileModal();
        expect(component.showProfileModal).toBeFalse();
    });

    it('should handle playerKicked event correctly', () => {
        playerKicked$.next();

        fixture.detectChanges();

        expect(RouterSpy.navigate).not.toHaveBeenCalled();
    });
    it('should navigate to main menu if socket is not alive', async () => {
        SocketServiceSpy.isSocketAlive.and.returnValue(false);
        spyOn(component, 'ngOnDestroy').and.callThrough();

        await component.ngOnInit();

        expect(component.ngOnDestroy).toHaveBeenCalled();
        expect(characterServiceSpy.resetCharacterAvailability).toHaveBeenCalled();
        expect(SocketServiceSpy.disconnect).toHaveBeenCalled();
        expect(RouterSpy.navigate).toHaveBeenCalledWith(['/main-menu']);
    });

    it('should initialize player preview and name on ngOnInit', async () => {
        SocketServiceSpy.isSocketAlive.and.returnValue(true);
        spyOn(component, 'listenToSocketMessages').and.callThrough();
        playerServiceSpy.player = mockPlayer;
        characterServiceSpy.getAvatarPreview.and.returnValue('avatarUrl');

        await component.ngOnInit();

        expect(component.playerPreview).toBe('avatarUrl');
        expect(component.playerName).toBe(mockPlayer.name);
    });

    it('should set isHost to true and create a new game if URL contains "host"', async () => {
        SocketServiceSpy.isSocketAlive.and.returnValue(true);
        RouterSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/waiting-room/host' });
        spyOn(component, 'getMapName').and.callThrough();
        spyOn(component, 'generateRandomNumber').and.callThrough();
        spyOn(component, 'createNewGame').and.callThrough();

        await component.ngOnInit();

        expect(component.isHost).toBeTrue();
        expect(component.getMapName).toHaveBeenCalled();
        expect(component.generateRandomNumber).toHaveBeenCalled();
        expect(component.createNewGame).toHaveBeenCalledWith(component.mapName);
    });

    afterEach(() => {
        gameStartedSubject.complete();
        playerJoinedSubject.complete();
        gameLockToggled$.complete();
        playerKicked$.complete();
        if (component.socketSubscription) {
            component.socketSubscription.unsubscribe();
        }
        (SocketServiceSpy.listen as jasmine.Spy).calls.reset();
    });
});
