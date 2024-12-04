import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { COUNTDOWN_COMBAT_DURATION } from '@common/constants';
import { CountdownEvents } from '@common/events/countdown.events';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CombatCountdownService {
    private countdownDuration = COUNTDOWN_COMBAT_DURATION;
    private socketSubscription = new Subscription();
    private combatCountdown = new BehaviorSubject<number>(this.countdownDuration);
    public combatCountdown$ = this.combatCountdown.asObservable();

    constructor(private socketService: SocketService) {
        this.listenCountdown();
        this.socketService = socketService;
    }

    listenCountdown() {
        this.socketSubscription.add(
            this.socketService.listen<number>(CountdownEvents.CombatSecondPassed).subscribe((remainingTime) => {
                this.combatCountdown.next(remainingTime);
            }),
        );
    }
}
