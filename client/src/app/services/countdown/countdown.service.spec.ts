import { TestBed } from '@angular/core/testing';
import { CountdownService } from './countdown.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Subject } from 'rxjs';

describe('CountdownService', () => {
    let service: CountdownService;
    let secondPassedSubject: Subject<number>;
    let counterFinishedSubject: Subject<void>;

    beforeEach(() => {
        secondPassedSubject = new Subject<number>();
        counterFinishedSubject = new Subject<void>();

        const socketServiceSpy = jasmine.createSpyObj('SocketService', ['listen']);
        socketServiceSpy.listen.withArgs('secondPassed').and.returnValue(secondPassedSubject.asObservable());
        socketServiceSpy.listen.withArgs('counterFinished').and.returnValue(counterFinishedSubject.asObservable());

        TestBed.configureTestingModule({
            providers: [
                CountdownService,
                { provide: SocketService, useValue: socketServiceSpy }
            ],
        });
        service = TestBed.inject(CountdownService);
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    it('should update countdown when "secondPassed" event is emitted', () => {
        let countdownValue: number | undefined;
        service.countdown$.subscribe(value => countdownValue = value);

        secondPassedSubject.next(15);
        expect(countdownValue).toBe(15);

        secondPassedSubject.next(5);
        expect(countdownValue).toBe(5);
    });

    it('should set countdown to 0 when "counterFinished" event is emitted', () => {
        let countdownValue: number | undefined;
        service.countdown$.subscribe(value => countdownValue = value);

        counterFinishedSubject.next();
        expect(countdownValue).toBe(0);
    });
});
