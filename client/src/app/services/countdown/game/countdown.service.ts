import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { TURN_DURATION } from '@common/constants';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CountdownService {
    private countdownDuration = TURN_DURATION;
    private socketSubscription = new Subscription();
    private countdown = new BehaviorSubject<number | string>(this.countdownDuration);
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
            this.socketService.listen('combatStartedSignal').subscribe(() => {
                this.countdown.next('--');
            }),
        );
    }
}
