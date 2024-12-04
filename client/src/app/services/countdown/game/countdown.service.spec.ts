import { TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CountdownService } from '@app/services/countdown/game/countdown.service';
import { CombatEvents } from '@common/events/combat.events';
import { Subject } from 'rxjs';

describe('CountdownService', () => {
    let service: CountdownService;
    let secondPassedSubject: Subject<number>;
    let combatStartedSubject: Subject<void>;

    beforeEach(() => {
        secondPassedSubject = new Subject<number>();
        combatStartedSubject = new Subject<void>();

        const socketServiceSpy = jasmine.createSpyObj('SocketService', ['listen']);
        socketServiceSpy.listen.withArgs('secondPassed').and.returnValue(secondPassedSubject.asObservable());
        socketServiceSpy.listen.withArgs(CombatEvents.CombatStartedSignal).and.returnValue(combatStartedSubject.asObservable());

        TestBed.configureTestingModule({
            providers: [CountdownService, { provide: SocketService, useValue: socketServiceSpy }],
        });
        service = TestBed.inject(CountdownService);
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    it('should update countdown when "secondPassed" event is emitted', () => {
        let countdownValue: number | string | undefined;
        service.countdown$.subscribe((value) => (countdownValue = value));

        secondPassedSubject.next(15);
        expect(countdownValue).toBe(15);

        secondPassedSubject.next(5);
        expect(countdownValue).toBe(5);
    });

    it('should set countdown to "--" when "combatStartedSignal" event is emitted', () => {
        let countdownValue: number | string | undefined;
        service.countdown$.subscribe((value) => (countdownValue = value));

        combatStartedSubject.next();
        expect(countdownValue).toBe('--');
    });
});
