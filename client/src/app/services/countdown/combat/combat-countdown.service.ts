import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CombatCountdownService {
    private countdownDuration = 5;
    // private noEvasionCountdownDuration = 3;
    private socketSubscription = new Subscription();
    private combatCountdown = new BehaviorSubject<number>(this.countdownDuration);
    public combatCountdown$ = this.combatCountdown.asObservable();

    constructor(private socketService: SocketService) {
        this.listenCountdown();
        this.socketService = socketService;
    }

    listenCountdown() {
        this.socketSubscription.add(
            this.socketService.listen<number>('combatSecondPassed').subscribe((remainingTime) => {
                console.log('le timer de combat fonctionne');
                this.combatCountdown.next(remainingTime);
            }),
        );
    }
}
