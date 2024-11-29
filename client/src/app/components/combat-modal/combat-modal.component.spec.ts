import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CombatCountdownService } from '@app/services/countdown/combat/combat-countdown.service';
import { GameService } from '@app/services/game/game.service';
import { ProfileType } from '@common/constants';
import { CombatEvents } from '@common/events/combat.events';
import { Player } from '@common/game';
import { Observable, of, Subject } from 'rxjs';
import { CombatModalComponent } from './combat-modal.component';

describe('CombatModalComponent', () => {
    let component: CombatModalComponent;
    let fixture: ComponentFixture<CombatModalComponent>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let combatCountdownServiceSpy: jasmine.SpyObj<CombatCountdownService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    const mockPlayer: Player = {
        socketId: 'player-socket-id',
        name: 'Player1',
        avatar: 1,
        isActive: true,
        specs: {
            evasions: 2,
            life: 100,
            speed: 10,
            attack: 15,
            defense: 10,
            attackBonus: 4,
            defenseBonus: 4,
            movePoints: 5,
            actions: 2,
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
            nEvasions: 0,
            nLifeTaken: 0,
            nLifeLost: 0,
            nItemsUsed: 0,
        },
        inventory: [],
        position: { x: 0, y: 0 },
        initialPosition: { x: 0, y: 0 },
        turn: 0,
        visitedTiles: [],
        profile: ProfileType.NORMAL,
    };

    const mockOpponent: Player = {
        ...mockPlayer,
        socketId: 'opponent-socket-id',
        name: 'Opponent',
    };

    beforeEach(async () => {
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['listen', 'sendMessage']);
        combatCountdownServiceSpy = jasmine.createSpyObj('CombatCountdownService', ['combatCountdown$']);
        combatCountdownServiceSpy.combatCountdown$ = new Subject<number>();
        gameServiceSpy = jasmine.createSpyObj('GameService', [], { game: { id: 'game-id' } });

        await TestBed.configureTestingModule({
            imports: [CombatModalComponent],
            providers: [
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: CombatCountdownService, useValue: combatCountdownServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CombatModalComponent);
        component = fixture.componentInstance;
        component.player = mockPlayer;
        component.opponent = mockOpponent;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('#turnMessage', () => {
        it('should return player turn message when it is the player’s turn', () => {
            component.isYourTurn = true;
            expect(component.turnMessage).toEqual("C'est à votre tour de jouer!");
        });

        it('should return opponent turn message when it is the opponent’s turn', () => {
            component.isYourTurn = false;
            expect(component.turnMessage).toEqual('Opponent est entrain de jouer.');
        });
    });

    describe('#attack', () => {
        it('should send an "attack" message when it is the player’s turn', () => {
            component.isYourTurn = true;
            component.attack();
            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith(CombatEvents.Attack, 'game-id');
        });

        it('should not send an "attack" message when it is not the player’s turn', () => {
            component.isYourTurn = false;
            component.attack();
            expect(socketServiceSpy.sendMessage).not.toHaveBeenCalled();
        });
    });

    describe('#listenForAttacks', () => {
        it('should update opponent and set combat message on "attackSuccess" when opponent is attacked', () => {
            const attackSuccessSubject = new Subject<Player>();
            socketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
                return eventName === 'attackSuccess' ? (attackSuccessSubject.asObservable() as Observable<T>) : (of() as Observable<T>);
            });

            component.listenForAttacks();
            attackSuccessSubject.next(mockOpponent);

            expect(component.opponent).toEqual(mockOpponent);
        });

        it('should update player and set combat message on "attackSuccess" when player is attacked', () => {
            const attackSuccessSubject = new Subject<Player>();
            socketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
                return eventName === 'attackSuccess' ? (attackSuccessSubject.asObservable() as Observable<T>) : (of() as Observable<T>);
            });

            component.listenForAttacks();
            attackSuccessSubject.next(mockPlayer);

            expect(component.player).toEqual(mockPlayer);
        });

        it('should set combat message on "attackFailure"', () => {
            const attackFailureSubject = new Subject<Player>();
            socketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
                return eventName === CombatEvents.AttackFailure ? (attackFailureSubject.asObservable() as Observable<T>) : (of() as Observable<T>);
            });

            component.listenForAttacks();
            attackFailureSubject.next(mockOpponent);
        });
    });

    describe('#listenForOpponent', () => {
        it('should update opponent on "currentPlayer" event', () => {
            const currentPlayerSubject = new Subject<Player>();
            socketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
                return eventName === 'currentPlayer' ? (currentPlayerSubject.asObservable() as Observable<T>) : (of() as Observable<T>);
            });

            component.listenForOpponent();
            currentPlayerSubject.next(mockOpponent);

            expect(component.opponent).toEqual(mockOpponent);
        });
    });

    describe('#listenForCombatTurns', () => {
        it('should set isYourTurn to true on "yourTurnCombat"', fakeAsync(() => {
            const yourTurnSubject = new Subject<void>();
            const playerTurnSubject = new Subject<void>();

            socketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
                switch (eventName) {
                    case CombatEvents.YourTurnCombat:
                        return yourTurnSubject.asObservable() as Observable<T>;
                    case CombatEvents.PlayerTurnCombat:
                        return playerTurnSubject.asObservable() as Observable<T>;
                    default:
                        return of() as Observable<T>;
                }
            });

            component.listenForCombatTurns();
            yourTurnSubject.next();
            tick();

            expect(component.isYourTurn).toBeTrue();
        }));

        it('should set isYourTurn to false on "playerTurnCombat"', fakeAsync(() => {
            const yourTurnSubject = new Subject<void>();
            const playerTurnSubject = new Subject<void>();

            socketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
                switch (eventName) {
                    case CombatEvents.YourTurnCombat:
                        return yourTurnSubject.asObservable() as Observable<T>;
                    case CombatEvents.PlayerTurnCombat:
                        return playerTurnSubject.asObservable() as Observable<T>;
                    default:
                        return of() as Observable<T>;
                }
            });

            component.listenForCombatTurns();
            playerTurnSubject.next();
            tick();

            expect(component.isYourTurn).toBeFalse();
        }));
    });

    describe('ngOnInit', () => {
        it('should initialize and call listeners', () => {
            spyOn(component, 'listenForAttacks');
            spyOn(component, 'listenForCombatTurns');
            spyOn(component, 'listenForCountdown');
            spyOn(component, 'listenForDiceRoll');

            component.ngOnInit();

            expect(component.listenForAttacks).toHaveBeenCalled();
            expect(component.listenForCombatTurns).toHaveBeenCalled();
            expect(component.listenForCountdown).toHaveBeenCalled();
            expect(component.listenForDiceRoll).toHaveBeenCalled();
        });
    });

    describe('#listenForCountdown', () => {
        it('should update countdown with the value emitted from combatCountdown$', fakeAsync(() => {
            const countdownSubject = combatCountdownServiceSpy.combatCountdown$ as Subject<number>;
            component.listenForCountdown();

            countdownSubject.next(3);
            tick();

            expect(component.countdown).toEqual(3);
        }));
    });

    describe('#listenForDiceRoll', () => {
        it('should update attack and defense totals based on dice roll and set attacking flag accordingly', () => {
            const diceRollSubject = new Subject<{ attackDice: number; defenseDice: number }>();
            socketServiceSpy.listen.and.returnValue(diceRollSubject.asObservable());

            component.isYourTurn = true;
            component.listenForDiceRoll();

            diceRollSubject.next({ attackDice: 6, defenseDice: 3 });

            expect(component.attackTotal).toEqual(6);
            expect(component.defenseTotal).toEqual(3);
            expect(component.attacking).toBeTrue();

            component.isYourTurn = false;
            diceRollSubject.next({ attackDice: 4, defenseDice: 5 });

            expect(component.attackTotal).toEqual(5);
            expect(component.defenseTotal).toEqual(4);
            expect(component.attacking).toBeFalse();
        });
    });

    describe('ngOnDestroy', () => {
        it('should unsubscribe from all subscriptions', () => {
            spyOn(component.socketSubscription, 'unsubscribe');
            component.ngOnDestroy();
            expect(component.socketSubscription.unsubscribe).toHaveBeenCalled();
        });
    });

    describe('#evade', () => {
        it('should send "startEvasion" message and set isYourTurn to false if it is the player’s turn', () => {
            component.isYourTurn = true;
            component.evade();

            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith(CombatEvents.StartEvasion, 'game-id');
            expect(component.isYourTurn).toBeFalse();
        });

        it('should not send "startEvasion" message if it is not the player’s turn', () => {
            component.isYourTurn = false;
            component.evade();

            expect(socketServiceSpy.sendMessage).not.toHaveBeenCalled();
        });
    });

    describe('#isItYourTurn', () => {
        it('should return true if it is not the player’s turn', () => {
            component.isYourTurn = false;
            expect(component.isItYourTurn()).toBeTrue();
        });

        it('should return false if it is the player’s turn', () => {
            component.isYourTurn = true;
            expect(component.isItYourTurn()).toBeFalse();
        });
    });
});
