// import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
// import { ActivatedRoute, Router } from '@angular/router';
// import { GamePageComponent } from '@app/pages/game-page/game-page';
// import { CharacterService } from '@app/services/character/character.service';
// import { SocketService } from '@app/services/communication-socket/communication-socket.service';
// import { CountdownService } from '@app/services/countdown/countdown.service';
// import { GameTurnService } from '@app/services/game/game-turn.service';
// import { PlayerService } from '@app/services/player-service/player.service';
// import { Avatar, Bonus, Game, Player } from '@common/game';
// import { Map, Mode } from '@common/map.types';
// import { Observable, of, Subject } from 'rxjs';

// describe('GamePageComponent', () => {
//     let component: GamePageComponent;
//     let fixture: ComponentFixture<GamePageComponent>;

//     let mockActivatedRoute: any;
//     let mockRouter: any;
//     let socketServiceSpy: jasmine.SpyObj<SocketService>;
//     let characterServiceSpy: jasmine.SpyObj<CharacterService>;
//     let playerServiceSpy: jasmine.SpyObj<PlayerService>;
//     let gameTurnServiceSpy: jasmine.SpyObj<GameTurnService>;
//     let countdownServiceSpy: jasmine.SpyObj<CountdownService>;

//     let playerLeftSubject: Subject<Player[]>;
//     let currentGameSubject: Subject<Game>;
//     let currentPlayersSubject: Subject<Player[]>;
//     let countdownSubject: Subject<number>;

//     const mockPlayer: Player = {
//         socketId: 'test-socket',
//         name: 'Test Player',
//         avatar: Avatar.Avatar1,
//         isActive: true,
//         position: { x: 0, y: 0 },
//         specs: {
//             life: 100,
//             speed: 10,
//             attack: 10,
//             defense: 10,
//             movePoints: 5,
//             actions: 2,
//             attackBonus: Bonus.D4,
//             defenseBonus: Bonus.D6,
//             nVictories: 0,
//             nDefeats: 0,
//             nCombats: 0,
//             nEvasions: 0,
//             nLifeTaken: 0,
//             nLifeLost: 0,
//         },
//         inventory: [],
//         turn: 0,
//         visitedTiles: [],
//     };

//     const mockMap: Map = {
//         mapSize: { x: 10, y: 10 },
//         tiles: [],
//         startTiles: [],
//         items: [],
//         doorTiles: [],
//         name: 'map',
//         description: 'description',
//         imagePreview:'image-preview', 
//         mode: Mode.Classic
//     };

//     const mockGame: Game = {
//         ...mockMap,
//         id: 'test-game-id',
//         hostSocketId: 'test-socket',
//         players: [mockPlayer],
//         hasStarted: true,
//         currentTurn: 0,
//     } as Game;

//     beforeEach(async () => {
//         mockActivatedRoute = {
//             snapshot: {
//                 params: { gameId: 'test-game-id' },
//             },
//         };
//         mockRouter = jasmine.createSpyObj('Router', ['navigate']);

//         socketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen', 'disconnect']);
//         characterServiceSpy = jasmine.createSpyObj('CharacterService', ['getAvatarPreview', 'resetCharacterAvailability']);
//         playerServiceSpy = jasmine.createSpyObj('PlayerService', ['setPlayer', 'resetPlayer'], { player: {} });
//         gameTurnServiceSpy = jasmine.createSpyObj('GameTurnService', ['listenForTurn', 'endTurn', 'movePlayer'], {
//             playerTurn$: new Subject<string>(),
//             youFell$: new Subject<boolean>(),
//             moves: new Map(),
//             game: mockGame,
//         });
//         countdownServiceSpy = jasmine.createSpyObj('CountdownService', ['resetCountdown', 'pauseCountdown', 'startCountdown'], {
//             countdown$: new Subject<number>(),
//         });

//         playerLeftSubject = new Subject<Player[]>();
//         currentGameSubject = new Subject<Game>();
//         currentPlayersSubject = new Subject<Player[]>();
//         countdownSubject = countdownServiceSpy.countdown$;

//         socketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
//             switch (eventName) {
//                 case 'playerLeft':
//                     return playerLeftSubject.asObservable() as Observable<T>;
//                 case 'currentGame':
//                     return currentGameSubject.asObservable() as Observable<T>;
//                 case 'currentPlayers':
//                     return currentPlayersSubject.asObservable() as Observable<T>;
//                 default:
//                     return of();
//             }
//         });

//         await TestBed.configureTestingModule({
//             imports: [GamePageComponent],
//             providers: [
//                 { provide: ActivatedRoute, useValue: mockActivatedRoute },
//                 { provide: Router, useValue: mockRouter },
//                 { provide: SocketService, useValue: socketServiceSpy },
//                 { provide: CharacterService, useValue: characterServiceSpy },
//                 { provide: PlayerService, useValue: playerServiceSpy },
//                 { provide: GameTurnService, useValue: gameTurnServiceSpy },
//                 { provide: CountdownService, useValue: countdownServiceSpy },
//             ],
//         }).compileComponents();

//         fixture = TestBed.createComponent(GamePageComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     beforeEach(()=>{
//         currentGameSubject.next(mockGame);
//         currentPlayersSubject.next([mockPlayer]);
//     });

//     it('should create the component', () => {
//         expect(component).toBeTruthy();
//     });

//     describe('#ngOnInit', () => {
//         it('should initialize gameId and load game data', () => {
//             spyOn(component, 'loadGameData');
//             spyOn(component, 'loadPlayerData');
//             component.ngOnInit();

//             expect(component.gameId).toBe('test-game-id');
//             expect(characterServiceSpy.getAvatarPreview).toHaveBeenCalled();
//             expect(component.loadGameData).toHaveBeenCalled();
//             expect(component.loadPlayerData).toHaveBeenCalled();
//             expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('getPlayers', 'test-game-id');
//             expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('getGame', 'test-game-id');
//         });

//         it('should reset and listen for countdown events', () => {
//             spyOn(component, 'listenForCountDown');
//             component.ngOnInit();
//             expect(countdownServiceSpy.resetCountdown).toHaveBeenCalled();
//             expect(component.listenForCountDown).toHaveBeenCalled();
//         });

//         it('should listen for player turns and players left events', () => {
//             spyOn(component, 'listenPlayersLeft');
//             component.ngOnInit();
//             expect(gameTurnServiceSpy.listenForTurn).toHaveBeenCalled();
//             expect(component.listenPlayersLeft).toHaveBeenCalled();
//         });
//     });

//     describe('#listenForCountDown', () => {
//         it('should update countdown and trigger pulse', fakeAsync(() => {
//             component.listenForCountDown();
//             countdownSubject.next(10);
//             expect(component.countdown).toBe(10);
//             tick(1000);
//             expect(component.isPulsing).toBe(true);
//             tick(500);
//             expect(component.isPulsing).toBe(false);
//         }));

//         it('should call endTurn when countdown reaches zero', () => {
//             component.listenForCountDown();
//             countdownSubject.next(0);
//             expect(gameTurnServiceSpy.endTurn).toHaveBeenCalled();
//         });
//     });

//     describe('#listenPlayersLeft', () => {
//         it('should show kicked modal and navigate when only one player remains', fakeAsync(() => {
//             component.listenPlayersLeft();
//             playerLeftSubject.next([{ ...mockPlayer, isActive: true } as Player]);

//             expect(component.showKickedModal).toBeTrue();
//             tick(3000); // Wait for timeout before navigation
//             expect(mockRouter.navigate).toHaveBeenCalledWith(['/main-menu']);
//         }));
//     });

//     describe('#loadGameData', () => {
//         it('should load game data and start the game if player is host', () => {
//             component.loadGameData();
//             const game: Game = {
//                 ...mockGame,
//                 id: 'test-game-id',
//                 hostSocketId: 'socket-1',
//                 players: [{ ...mockPlayer, socketId: 'socket-1', isActive: true } as Player],
//             } as Game;
//             currentGameSubject.next(game);

//             expect(gameTurnServiceSpy.game).toEqual(game);
//             expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('startGame', 'test-game-id');
//         });
//     });

//     describe('#playTurn', () => {
//         it('should start countdown after delay', fakeAsync(() => {
//             spyOn(countdownServiceSpy, 'startCountdown');
//             component.playTurn();
//             tick(3000); // Simulate 3-second delay
//             expect(countdownServiceSpy.startCountdown).toHaveBeenCalled();
//         }));
//     });

//     describe('#confirmExit', () => {
//         it('should navigate to main menu and reset character and player data', () => {
//             component.confirmExit();
//             expect(mockRouter.navigate).toHaveBeenCalledWith(['/main-menu']);
//             expect(characterServiceSpy.resetCharacterAvailability).toHaveBeenCalled();
//             expect(playerServiceSpy.resetPlayer).toHaveBeenCalled();
//         });
//     });

//     describe('#ngOnDestroy', () => {
//         it('should disconnect socket and send leave game message', () => {
//             component.ngOnDestroy();
//             expect(socketServiceSpy.disconnect).toHaveBeenCalled();
//             expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('leaveGame', 'test-game-id');
//         });
//     });
// });
