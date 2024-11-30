import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { ProfileType } from '@common/constants';
import { Player } from '@common/game';
import { Subject, take } from 'rxjs';
import { CombatService } from './combat.service';

describe('CombatService', () => {
    let service: CombatService;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;

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

    beforeEach(() => {
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['listen']);
        playerServiceSpy = jasmine.createSpyObj('PlayerService', ['setPlayer'], { player: mockPlayer });

        TestBed.configureTestingModule({
            providers: [
                CombatService,
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: PlayerService, useValue: playerServiceSpy },
            ],
        });

        service = TestBed.inject(CombatService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('#listenCombatStart', () => {
        it('should set the opponent and open the combat modal when "combatStarted" event is received', () => {
            const combatStartedSubject = new Subject<{ challenger: Player; opponent: Player }>();
            socketServiceSpy.listen.and.returnValue(combatStartedSubject.asObservable());

            service.listenCombatStart();

            combatStartedSubject.next({ challenger: mockPlayer, opponent: mockOpponent });

            service.opponent$.pipe(take(1)).subscribe((opponent) => {
                expect(opponent).toEqual(mockOpponent);
            });
            service.isCombatModalOpen$.pipe(take(1)).subscribe((isOpen) => {
                expect(isOpen).toBeTrue();
            });
        });

        it('should set the challenger as the opponent when the player is the opponent in "combatStarted"', () => {
            const combatStartedSubject = new Subject<{ challenger: Player; opponent: Player }>();
            socketServiceSpy.listen.and.returnValue(combatStartedSubject.asObservable());

            service.listenCombatStart();

            combatStartedSubject.next({ challenger: mockOpponent, opponent: mockPlayer });

            service.opponent$.pipe(take(1)).subscribe((opponent) => {
                expect(opponent).toEqual(mockOpponent);
            });
            service.isCombatModalOpen$.pipe(take(1)).subscribe((isOpen) => {
                expect(isOpen).toBeTrue();
            });
        });
    });

    describe('#listenForCombatFinish', () => {
        it('should close the combat modal 3 seconds after receiving "combatFinishedNormally" event', fakeAsync(() => {
            const combatFinishedSubject = new Subject<Player>();
            socketServiceSpy.listen.and.returnValue(combatFinishedSubject.asObservable());

            service.listenForCombatFinish();

            combatFinishedSubject.next(mockPlayer);
            tick(3000); // Simulate 3 seconds delay

            service.isCombatModalOpen$.pipe(take(1)).subscribe((isOpen) => {
                expect(isOpen).toBeFalse();
            });
        }));
    });

    describe('#listenForEvasionInfo', () => {
        it('should close the combat modal 3 seconds after "evasionSuccess" event', fakeAsync(() => {
            const evasionSuccessSubject = new Subject<Player>();
            socketServiceSpy.listen.and.returnValue(evasionSuccessSubject.asObservable());

            service.listenForEvasionInfo();

            evasionSuccessSubject.next(mockPlayer);
            tick(3000);

            service.isCombatModalOpen$.pipe(take(1)).subscribe((isOpen) => {
                expect(isOpen).toBeFalse();
            });
        }));

        it('should update the current player on evasion failure if the evading player is the current player', () => {
            const evasionFailedSubject = new Subject<Player>();
            socketServiceSpy.listen.and.returnValue(evasionFailedSubject.asObservable());

            service.listenForEvasionInfo();

            evasionFailedSubject.next(mockPlayer);

            expect(playerServiceSpy.setPlayer).toHaveBeenCalledWith(mockPlayer);
            service.opponent$.pipe(take(1)).subscribe((opponent) => {
                expect(opponent).toEqual(service.defaultPlayer);
            });
        });

        it('should update the opponent on evasion failure if the evading player is the opponent', () => {
            const evasionFailedSubject = new Subject<Player>();
            socketServiceSpy.listen.and.returnValue(evasionFailedSubject.asObservable());

            service.listenForEvasionInfo();

            evasionFailedSubject.next(mockOpponent);

            service.opponent$.pipe(take(1)).subscribe((opponent) => {
                expect(opponent).toEqual(mockOpponent);
            });
            expect(playerServiceSpy.setPlayer).not.toHaveBeenCalled();
        });
    });
});
