import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { TURN_DURATION } from '@common/constants';
import { CombatEvents } from '@common/events/combat.events';
import { CountdownEvents } from '@common/events/countdown.events';
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
            this.socketService.listen<number>(CountdownEvents.SecondPassed).subscribe((remainingTime) => {
                this.countdown.next(remainingTime);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen(CombatEvents.CombatStartedSignal).subscribe(() => {
                this.countdown.next('--');
            }),
        );
    }
}
