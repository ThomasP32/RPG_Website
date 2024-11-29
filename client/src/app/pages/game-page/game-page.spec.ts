import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CountdownService } from '@app/services/countdown/game/countdown.service';
import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { GameService } from '@app/services/game/game.service';
import { JournalService } from '@app/services/journal/journal.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { TURN_DURATION } from '@common/constants';
import { MovesMap } from '@common/directions';
import { GameCreationEvents } from '@common/events/game-creation.events';
import { Avatar, Bonus, Game, Player } from '@common/game';
import { GamePageActiveView } from '@common/game-page';
import { JournalEntry } from '@common/journal-entry';
import { Coordinate, DoorTile, ItemCategory, Mode, TileCategory } from '@common/map.types';
import { Observable, of, Subject } from 'rxjs';
import { GamePageComponent } from './game-page';

const mockPlayer: Player = {
    socketId: 'test-socket',
    name: 'Test Player',
    avatar: Avatar.Avatar1,
    isActive: true,
    position: { x: 0, y: 0 },
    initialPosition: { x: 0, y: 0 },
    specs: {
        evasions: 2,
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
    inventory: [ItemCategory.Amulet, ItemCategory.Armor],
    turn: 0,
    visitedTiles: [],
};

const mockGame: Game = {
    id: 'test-game-id',
    hostSocketId: 'test-socket',
    hasStarted: true,
    currentTurn: 0,
    mapSize: { x: 10, y: 10 },
    tiles: [
        { coordinate: { x: 2, y: 2 }, category: TileCategory.Water },
        { coordinate: { x: 3, y: 3 }, category: TileCategory.Ice },
        { coordinate: { x: 4, y: 4 }, category: TileCategory.Wall },
    ],
    doorTiles: [
        { coordinate: { x: 1, y: 2 }, isOpened: false },
        { coordinate: { x: 2, y: 1 }, isOpened: true },
    ],
    startTiles: [{ coordinate: { x: 0, y: 0 } }],
    items: [{ coordinate: { x: 0, y: 1 }, category: ItemCategory.Armor }],
    players: [mockPlayer],
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
        const playerLeftSubject = new Subject<Player[]>();
        const possibleOpponentsSubject = new Subject<Player[]>();
        const delaySubject = new Subject<number>();
        const possibleDoorsSubject = new Subject<DoorTile[]>();
        const playerWonSubject = new Subject<boolean>();

        const gameSpy = jasmine.createSpyObj('GameService', ['setGame'], {
            game: mockGame,
        });
        const routerSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/game-page' });
        const playerSpy = jasmine.createSpyObj('PlayerService', ['resetPlayer'], { player: mockPlayer });
        const characterSpy = jasmine.createSpyObj('CharacterService', ['getAvatarPreview', 'resetCharacterAvailability']);
        const socketSpy = jasmine.createSpyObj('SocketService', ['listen', 'sendMessage', 'disconnect']);
        const countdownSpy = jasmine.createSpyObj('CountdownService', [], {
            countdown$: new Subject<number>(),
        });
        const journalSpy = jasmine.createSpyObj('JournalService', [], { journalEntries$: new Subject<JournalEntry[]>() });
        const gameTurnSpy = jasmine.createSpyObj(
            'GameTurnService',
            [
                'listenForTurn',
                'endTurn',
                'movePlayer',
                'listenForPlayerMove',
                'listenMoves',
                'endGame',
                'listenForPossibleCombats',
                'getMoves',
                'listenForDoors',
                'listenForDoorUpdates',
                'listenForCombatConclusion',
                'toggleDoor',
                'listenForEndOfGame',
            ],
            {
                playerTurn$: playerTurnSubject,
                youFell$: youFellSubject,
                playerWon$: playerWonSubject,
                possibleOpponents$: possibleOpponentsSubject,
                moves: mockMoves,
                possibleDoors$: possibleDoorsSubject,
                actionsDone: { door: false },
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
                { provide: JournalService, useValue: journalSpy },
                { provide: GameTurnService, useValue: gameTurnSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        characterService = TestBed.inject(CharacterService) as jasmine.SpyObj<CharacterService>;
        gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
        playerService = TestBed.inject(PlayerService) as jasmine.SpyObj<PlayerService>;
        socketService = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
        countdownService = TestBed.inject(CountdownService) as jasmine.SpyObj<CountdownService>;
        gameTurnService = TestBed.inject(GameTurnService) as jasmine.SpyObj<GameTurnService>;

        socketSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
            switch (eventName) {
                case GameCreationEvents.PlayerLeft:
                    return playerLeftSubject.asObservable() as Observable<T>;
                case 'delay':
                    return delaySubject.asObservable() as Observable<T>;
                default:
                    return of();
            }
        });

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should toggle view to journal', () => {
        component.toggleView(GamePageActiveView.Journal);
        expect(component.activeView).toBe(GamePageActiveView.Journal);
    });

    it('should toggle view to chat', () => {
        component.toggleView(GamePageActiveView.Chat);
        expect(component.activeView).toBe(GamePageActiveView.Chat);
    });

    it('should initialize player preview on init', () => {
        component.ngOnInit();
        expect(characterService.getAvatarPreview).toHaveBeenCalledWith(mockPlayer.avatar);
        expect(component.playerPreview).toBe(characterService.getAvatarPreview(mockPlayer.avatar));
    });

    it('should navigate to end of game on navigateToEndOfGame', () => {
        component.navigateToEndOfGame();
        expect(router.navigate).toHaveBeenCalledWith(['/end-game']);
    });

    it('should listen for possible opponents updates', () => {
        component.ngOnInit();
        const possibleOpponents: Player[] = [mockPlayer];
        (gameTurnService.possibleOpponents$ as Subject<Player[]>).next(possibleOpponents);
        expect(component.possibleOpponents).toEqual(possibleOpponents);
    });
    it('should trigger pulse on countdown update', () => {
        spyOn(component, 'triggerPulse');
        component.ngOnInit();
        (countdownService.countdown$ as Subject<number>).next(10);
        expect(component.triggerPulse).toHaveBeenCalled();
    });

    it('should set isPulsing to true and then false after triggerPulse', fakeAsync(() => {
        component.triggerPulse();
        expect(component.isPulsing).toBeTrue();
        tick(500);
        expect(component.isPulsing).toBeFalse();
    }));

    it('should navigate to main menu on confirm exit', () => {
        spyOn(component, 'navigateToMain');
        component.confirmExit();
        expect(component.navigateToMain).toHaveBeenCalled();
    });

    it('should update active players when player leaves', fakeAsync(() => {
        const mockPlayers = [
            { isActive: true, position: { x: 0, y: 1 }, inventory: [ItemCategory.Amulet, ItemCategory.Armor] },
            { isActive: false, position: { x: 1, y: 0 }, inventory: [ItemCategory.Amulet, ItemCategory.Armor] },
        ] as unknown as Player;
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

    it('should call gameTurnService endTurn on endTurn', () => {
        component.endTurn();
        component.navigateToEndOfGame();
        expect(gameTurnService.endTurn).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/end-game']);
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
        component.ngOnInit();
        (gameTurnService.playerWon$ as Subject<boolean>).next(true);

        expect(component.showEndGameModal).toBe(true);

        tick(5000);

        expect(component.navigateToEndOfGame).toHaveBeenCalled();
    }));

    it('should not call navigateToEndOfGame if game is not over', fakeAsync(() => {
        spyOn(component, 'navigateToEndOfGame');
        component.ngOnInit();
        (gameTurnService.playerWon$ as Subject<boolean>).next(false);

        expect(component.gameOverMessage).toBe(false);

        tick(5000);

        expect(component.navigateToEndOfGame).not.toHaveBeenCalled();
    }));

    it('should handle start turn delay and update countdown correctly', fakeAsync(() => {
        component.delayFinished = false;
        const delaySubject = new Subject<number>();
        socketService.listen.and.returnValue(delaySubject.asObservable());

        component.listenForStartTurnDelay();

        delaySubject.next(3);
        tick();
        fixture.detectChanges();

        expect(component.startTurnCountdown).toBe(3);
        expect(component.delayFinished).toBe(false);

        delaySubject.next(0);
        tick();
        fixture.detectChanges();
        expect(component.startTurnCountdown).toBe(3);
        expect(component.delayFinished).toBe(true);
    }));

    it('should call gameTurnService.movePlayer with the correct position on tile click', () => {
        const position: Coordinate = { x: 2, y: 3 };

        component.onTileClickToMove(position);

        component.onTileClickToMove(position);

        expect(gameTurnService.movePlayer).toHaveBeenCalledWith(position);
    });

    describe('#listenForDoorOpening', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        it('should set doorActionAvailable to true and update actionMessage to "Fermer la porte" if first door is opened', () => {
            const possibleDoors: DoorTile[] = [{ coordinate: { x: 1, y: 1 }, isOpened: true }];
            gameTurnService.doorAlreadyToggled = false;

            (gameTurnService.possibleDoors$ as Subject<DoorTile[]>).next(possibleDoors);

            expect(component.doorActionAvailable).toBeTrue();
            expect(component.possibleDoors).toEqual(possibleDoors);
            expect(component.actionMessage).toBe('Fermer la porte');
        });

        it('should set doorActionAvailable to true and update actionMessage to "Ouvrir la porte" if first door is closed', () => {
            const possibleDoors: DoorTile[] = [{ coordinate: { x: 1, y: 1 }, isOpened: false }];
            gameTurnService.doorAlreadyToggled = false;

            (gameTurnService.possibleDoors$ as Subject<DoorTile[]>).next(possibleDoors);

            expect(component.doorActionAvailable).toBeTrue();
            expect(component.possibleDoors).toEqual(possibleDoors);
            expect(component.actionMessage).toBe('Ouvrir la porte');
        });

        it('should set doorActionAvailable to false and reset actionMessage if actionsDone.door is true', () => {
            gameTurnService.doorAlreadyToggled = true;

            component.ngOnInit();

            const possibleDoors: DoorTile[] = [{ coordinate: { x: 1, y: 1 }, isOpened: false }];
            (gameTurnService.possibleDoors$ as Subject<DoorTile[]>).next(possibleDoors);

            expect(component.doorActionAvailable).toBeFalse();
            expect(component.possibleDoors).toEqual([]);
            expect(component.actionMessage).toBe('Actions possibles');
        });

        it('should set doorActionAvailable to false and reset actionMessage if no doors are available', () => {
            const possibleDoors: DoorTile[] = [];
            gameTurnService.doorAlreadyToggled = false;

            (gameTurnService.possibleDoors$ as Subject<DoorTile[]>).next(possibleDoors);

            expect(component.doorActionAvailable).toBeFalse();
            expect(component.possibleDoors).toEqual([]);
            expect(component.actionMessage).toBe('Actions possibles');
        });
    });

    it('should set showActionModal to true when openActionModal is called', () => {
        component.showActionModal = false;

        component.openActionModal();

        expect(component.showActionModal).toBeTrue();
    });

    it('should set combatAvailable to false and clear possibleOpponents if no combat is available', () => {
        component.combatAvailable = true;
        component.possibleOpponents = [mockPlayer];

        (gameTurnService.possibleOpponents$ as Subject<Player[]>).next([]);

        component.ngOnInit();

        expect(component.combatAvailable).toBeFalse();
        expect(component.possibleOpponents).toEqual([]);
    });

    it('should call gameTurnService.toggleDoor with the first possible door when doorActionAvailable is true', () => {
        component.doorActionAvailable = true;
        component.possibleDoors = [{ coordinate: { x: 1, y: 1 }, isOpened: true }];

        component.toggleDoor();

        expect(gameTurnService.toggleDoor).toHaveBeenCalledWith(component.possibleDoors[0]);
    });

    it('should not call gameTurnService.toggleDoor when doorActionAvailable is false', () => {
        component.doorActionAvailable = false;
        component.possibleDoors = [{ coordinate: { x: 1, y: 1 }, isOpened: true }];

        component.toggleDoor();

        expect(gameTurnService.toggleDoor).not.toHaveBeenCalled();
    });
});
