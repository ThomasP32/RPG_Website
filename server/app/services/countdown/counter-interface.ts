import { Subscription } from 'rxjs';

export interface Countdown {
    duration: number;
    remaining: number;
    timerSubscription?: Subscription;
}
