import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CombatCountdownService {
    private countdownDuration = 5;
    private noEvasionCountdownDuration = 3;
    private socketSubscription = new Subscription();
    private countdown = new BehaviorSubject<number>(this.countdownDuration);
    public countdown$ = this.countdown.asObservable();

    constructor(private socketService: SocketService) {
        this.listenCountdown();
        this.socketService = socketService;
    }

    listenCountdown() {
        this.socketSubscription.add(
            this.socketService.listen<number>('secondPassed').subscribe((remainingTime) => {
                this.countdown.next(remainingTime);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<number>('counterFinished').subscribe(() => {
                this.countdown.next(0);
            }),
        );
    }
}
