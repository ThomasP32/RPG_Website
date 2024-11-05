import { TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Subject } from 'rxjs';
import { CombatCountdownService } from './combat-countdown.service';

describe('CountdownService', () => {
    let service: CombatCountdownService;
    let secondPassedSubject: Subject<number>;

    beforeEach(() => {
        secondPassedSubject = new Subject<number>();

        const socketServiceSpy = jasmine.createSpyObj('SocketService', ['listen']);
        socketServiceSpy.listen.withArgs('combatSecondPassed').and.returnValue(secondPassedSubject.asObservable());

        TestBed.configureTestingModule({
            providers: [CombatCountdownService, { provide: SocketService, useValue: socketServiceSpy }],
        });
        service = TestBed.inject(CombatCountdownService);
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    it('should update countdown when "CombatSecondPassed" event is emitted', () => {
        let countdownValue: number | undefined;
        service.combatCountdown$.subscribe((value: number) => (countdownValue = value));

        secondPassedSubject.next(4);
        expect(countdownValue).toBe(4);

        secondPassedSubject.next(3);
        expect(countdownValue).toBe(3);
    });
});
