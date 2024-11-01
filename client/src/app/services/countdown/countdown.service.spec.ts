import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CountdownService } from './countdown.service';

describe('CountdownService', () => {
    let service: CountdownService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CountdownService],
        });
        service = TestBed.inject(CountdownService);
    });

    afterEach(() => {
        // Ensure any ongoing timers are stopped after each test
        service.pauseCountdown();
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    describe('#startCountdown', () => {
        it('should start countdown from the initial duration', fakeAsync(() => {
            service.startCountdown();
            expect(service.countdown$.getValue()).toBe(30);

            tick(1000); // Simulate 1 second
            expect(service.countdown$.getValue()).toBe(29);

            tick(29000); // Simulate remaining 29 seconds
            expect(service.countdown$.getValue()).toBe(0);

            service.pauseCountdown(); // Stop any further intervals
        }));
    });

    describe('#stopCountDown', () => {
        it('should reset countdown to initial duration and stop it', fakeAsync(() => {
            service.startCountdown();
            tick(5000); // Simulate 5 seconds
            service.stopCountDown();

            expect(service.countdown$.getValue()).toBe(30);
            tick(1000); // Check that countdown does not continue
            expect(service.countdown$.getValue()).toBe(30);
        }));
    });

    describe('#resetCountdown', () => {
        it('should reset countdown to initial duration and start again', fakeAsync(() => {
            service.startCountdown();
            tick(5000); // Simulate 5 seconds

            service.resetCountdown();
            expect(service.countdown$.getValue()).toBe(30);

            tick(1000); // Countdown should restart from 30
            expect(service.countdown$.getValue()).toBe(29);

            service.pauseCountdown(); // Stop any further intervals
        }));
    });

    describe('#pauseCountdown', () => {
        it('should pause countdown at current value', fakeAsync(() => {
            service.startCountdown();
            tick(5000); // Countdown progresses by 5 seconds
            service.pauseCountdown();

            expect(service.countdown$.getValue()).toBe(25);
            tick(1000); // Countdown should remain paused
            expect(service.countdown$.getValue()).toBe(25);
        }));
    });

    describe('#resumeCountdown', () => {
        it('should resume countdown from paused value', fakeAsync(() => {
            service.startCountdown();
            tick(5000); // Countdown progresses by 5 seconds
            service.pauseCountdown();
            expect(service.countdown$.getValue()).toBe(25);

            service.resumeCountdown();
            tick(1000); // Countdown should resume
            expect(service.countdown$.getValue()).toBe(24);

            service.pauseCountdown(); // Stop any further intervals
        }));

        it('should not resume if countdown is zero', fakeAsync(() => {
            service.startCountdown();
            tick(30000); // Countdown reaches zero
            expect(service.countdown$.getValue()).toBe(0);

            service.pauseCountdown();
            service.resumeCountdown();
            tick(1000); // No further changes expected as countdown is at zero
            expect(service.countdown$.getValue()).toBe(0);
        }));
    });
});
