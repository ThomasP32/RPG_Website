import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MovesMap } from '@app/interfaces/moves';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CountdownService } from '@app/services/countdown/game/countdown.service';
import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { TURN_DURATION } from '@common/constants';
import { Avatar, Bonus, Game, Player, Specs } from '@common/game';
import { Map, Mode } from '@common/map.types';
import { Observable, of, Subject } from 'rxjs';
import { GamePageComponent } from './game-page';

const mockPlayer: Player = {
    socketId: 'test-socket',
    name: 'Test Player',
    avatar: Avatar.Avatar1,
    isActive: true,
    position: { x: 0, y: 0 },
    specs: {
        life: 100,
        speed: 10,
        attack: 10,
        defense: 10,
        movePoints: 5,
        actions: 2,
        attackBonus: Bonus.D4,
        defenseBonus: Bonus.D6,
        nVictories: 0,
        nDefeats: 0,
        nCombats: 0,
        nEvasions: 0,
        nLifeTaken: 0,
        nLifeLost: 0,
    },
    inventory: [],
    turn: 0,
    visitedTiles: [],
};

const mockGame: Game = {
    id: 'test-game-id',
    hostSocketId: 'test-socket',
    hasStarted: true,
    currentTurn: 0,
    mapSize: { x: 5, y: 5 },
    tiles: [],
    doorTiles: [],
    startTiles: [],
    items: [],
    players: [],
    mode: Mode.Classic,
    nTurns: 0,
    debug: false,
    nDoorsManipulated: 0,
    duration: 0,
    isLocked: true,
    name: 'game',
    description: 'game description',
    imagePreview: 'image-preview',
};

const mockMoves: MovesMap = new Map([
    ['1,1', { path: [{ x: 1, y: 1 }], weight: 1 }],
    ['2,2', { path: [{ x: 2, y: 2 }], weight: 2 }],
]);

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let gameService: jasmine.SpyObj<GameService>;
    let playerService: jasmine.SpyObj<PlayerService>;
    let socketService: jasmine.SpyObj<SocketService>;
    let countdownService: jasmine.SpyObj<CountdownService>;
    let gameTurnService: jasmine.SpyObj<GameTurnService>;
    let characterService: jasmine.SpyObj<CharacterService>;
    let router: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        const playerTurnSubject = new Subject<string>();
        const youFellSubject = new Subject<boolean>();
        const playerWonSubject = new Subject<boolean>();
        const playerLeftSubject = new Subject<Player[]>();
        const delaySubject = new Subject<number>();

        const gameSpy = jasmine.createSpyObj('GameService', ['game']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        routerSpy.url = '/game-page';
        const playerSpy = jasmine.createSpyObj('PlayerService', ['player', 'resetPlayer']);
        const characterSpy = jasmine.createSpyObj('CharacterService', ['getAvatarPreview', 'resetCharacterAvailability']);
        const socketSpy = jasmine.createSpyObj('SocketService', ['listen', 'sendMessage', 'disconnect']);
        const countdownSpy = jasmine.createSpyObj('CountdownService', [], {
            countdown$: new Subject<number>(),
        });
        const gameTurnSpy = jasmine.createSpyObj(
            'GameTurnService',
            ['listenForTurn', 'endTurn', 'movePlayer', 'listenForPlayerMove', 'listenMoves', 'endGame'],
            {
                playerTurn$: playerTurnSubject,
                youFell$: youFellSubject,
                playerWon$: playerWonSubject,
                moves: mockMoves,
            },
        );

        await TestBed.configureTestingModule({
            imports: [GamePageComponent],
            providers: [
                { provide: GameService, useValue: gameSpy },
                { provide: PlayerService, useValue: playerSpy },
                { provide: CharacterService, useValue: characterSpy },
                { provide: SocketService, useValue: socketSpy },
                { provide: CountdownService, useValue: countdownSpy },
                { provide: GameTurnService, useValue: gameTurnSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;

        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

        characterService = TestBed.inject(CharacterService) as jasmine.SpyObj<CharacterService>;
        gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
        playerService = TestBed.inject(PlayerService) as jasmine.SpyObj<PlayerService>;
        socketService = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
        countdownService = TestBed.inject(CountdownService) as jasmine.SpyObj<CountdownService>;
        gameTurnService = TestBed.inject(GameTurnService) as jasmine.SpyObj<GameTurnService>;

        component.activePlayers = [];
        component.currentPlayerTurn = '';
        component.startTurnCountdown = 0;
        component.isYourTurn = false;
        component.delayFinished = false;
        component.isPulsing = false;
        component.countdown = 0;
        component.playerPreview = '';
        component.showExitModal = false;
        component.showKickedModal = false;
        component.gameOverMessage = false;
        component.youFell = false;
        component.map = {} as Map;
        component.specs = {} as Specs;

        gameSpy.game = mockGame;
        playerSpy.player = mockPlayer;
        gameTurnSpy.moves = mockMoves;

        socketSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
            switch (eventName) {
                case 'playerLeft':
                    return playerLeftSubject.asObservable() as Observable<T>;
                case 'delay':
                    return delaySubject.asObservable() as Observable<T>;
                default:
                    return of();
            }
        });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize game turn listeners on init', () => {
        spyOn(component, 'listenForFalling').and.callThrough();
        spyOn(component, 'listenForCountDown').and.callThrough();
        spyOn(component, 'listenPlayersLeft').and.callThrough();
        spyOn(component, 'listenForCurrentPlayerUpdates').and.callThrough();
        spyOn(component, 'listenForStartTurnDelay').and.callThrough();

        component.ngOnInit();

        expect(gameTurnService.listenForTurn).toHaveBeenCalled();
        expect(gameTurnService.listenForPlayerMove).toHaveBeenCalled();
        expect(gameTurnService.listenMoves).toHaveBeenCalled();
        expect(component.listenForFalling).toHaveBeenCalled();
        expect(component.listenForCountDown).toHaveBeenCalled();
        expect(component.listenPlayersLeft).toHaveBeenCalled();
        expect(component.listenForCurrentPlayerUpdates).toHaveBeenCalled();
        expect(component.listenForStartTurnDelay).toHaveBeenCalled();
    });

    it('should navigate to main menu on confirm exit', () => {
        spyOn(component, 'navigateToMain');
        component.confirmExit();
        expect(component.navigateToMain).toHaveBeenCalled();
    });

    it('should update active players when player leaves', fakeAsync(() => {
        const mockPlayers = [{ isActive: true }, { isActive: false }] as any;
        socketService.listen.and.returnValue(of(mockPlayers));

        component.listenPlayersLeft();
        expect(component.activePlayers.length).toBe(1);
        tick(3000);
        expect(router.navigate).toHaveBeenCalledWith(['/main-menu']);
    }));

    it('should start game if player is host', () => {
        playerService.player.socketId = 'hostSocketId';
        gameService.game.hostSocketId = 'hostSocketId';

        component.ngOnInit();
        expect(socketService.sendMessage).toHaveBeenCalledWith('startGame', gameService.game.id);
    });

    it('should listen for player turn updates and set isYourTurn to true if playerName matches', () => {
        component.ngOnInit();
        component.player.name = 'Test Player';
        (gameTurnService.playerTurn$ as Subject<string>).next('Test Player');

        expect(component.currentPlayerTurn).toBe('Test Player');
        expect(component.isYourTurn).toBe(true);
        expect(component.countdown).toBe(TURN_DURATION);
        expect(component.delayFinished).toBe(false);
    });

    it('should listen for player turn updates and set isYourTurn to false if playerName does not match', () => {
        component.ngOnInit();

        (gameTurnService.playerTurn$ as Subject<string>).next('OtherPlayer');

        expect(component.currentPlayerTurn).toBe('OtherPlayer');
        expect(component.isYourTurn).toBe(false);
        expect(component.countdown).toBe(TURN_DURATION);
        expect(component.delayFinished).toBe(false);
    });

    it('should listen for falling event', () => {
        component.ngOnInit();
        (gameTurnService.youFell$ as Subject<boolean>).next(true);
        expect(component.youFell).toBe(true);
    });

    it('should listen for countdown updates', () => {
        component.ngOnInit();
        (countdownService.countdown$ as Subject<number>).next(10);
        expect(component.countdown).toBe(10);
    });

    it('should handle start turn delay', () => {
        const delaySubject = new Subject<number>();
        socketService.listen.and.returnValue(delaySubject.asObservable());

        component.listenForStartTurnDelay();
        delaySubject.next(3);
        expect(component.startTurnCountdown).toBe(3);
    });

    it('it should call gameTurnService endTurn on endTurn', () => {
        component.endTurn();
        component.navigateToEndOfGame();
        expect(gameTurnService.endTurn).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/main-menu']);
    });

    it('should open the exit confirmation modal', () => {
        component.openExitConfirmationModal();
        expect(component.showExitModal).toBeTrue();
    });

    it('should close the exit modal', () => {
        component.showExitModal = true;
        component.closeExitModal();
        expect(component.showExitModal).toBeFalse();
    });

    it('should confirm exit and perform required actions', () => {
        component.confirmExit();

        expect(socketService.disconnect).toHaveBeenCalled();
        expect(characterService.resetCharacterAvailability).toHaveBeenCalled();
        expect(playerService.resetPlayer).toHaveBeenCalled();

        expect(router.navigate).toHaveBeenCalledWith(['/main-menu']);

        expect(component.showExitModal).toBeFalse();
    });

    it('should listen for game over updates and set gameOverMessage', fakeAsync(() => {
        spyOn(component, 'navigateToEndOfGame');
        component.listenForGameOver();

        (gameTurnService.playerWon$ as Subject<boolean>).next(true);

        expect(component.gameOverMessage).toBe(true);

        tick(5000);

        expect(component.navigateToEndOfGame).toHaveBeenCalled();
    }));

    it('should not call navigateToEndOfGame if game is not over', fakeAsync(() => {
        spyOn(component, 'navigateToEndOfGame');
        component.listenForGameOver();

        (gameTurnService.playerWon$ as Subject<boolean>).next(false);

        expect(component.gameOverMessage).toBe(false);

        tick(5000);

        expect(component.navigateToEndOfGame).not.toHaveBeenCalled();
    }));

    it('should listen for start turn delay updates, update countdown, and handle delayFinished correctly', fakeAsync(() => {
        spyOn(component, 'triggerPulse');

        const delaySubject = new Subject<number>();
        socketService.listen.and.returnValue(delaySubject.asObservable());

        component.listenForStartTurnDelay();

        delaySubject.next(3);
        tick(3000);
        expect(component.startTurnCountdown).toBe(3);
        expect(component.triggerPulse).toHaveBeenCalled();
        expect(component.delayFinished).toBeFalse();

        delaySubject.next(0);
        expect(component.startTurnCountdown).toBe(0);
        expect(component.delayFinished).toBeTrue();
    }));
});
