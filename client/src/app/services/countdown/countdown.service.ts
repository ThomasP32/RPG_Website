import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CountdownService {
  private countdownDuration = 30; 
  private countdown = this.countdownDuration;
  private timerSubscription!: Subscription;

  countdown$ = new BehaviorSubject<number>(this.countdown);

  startCountdown(): void {
    this.pauseCountdown();
    this.timerSubscription = interval(1000)
      .pipe(takeWhile(() => this.countdown > 0))
      .subscribe(() => {
        this.countdown--;
        this.countdown$.next(this.countdown);
      });
  }

  stopCountDown(): void {
    this.pauseCountdown(); 
    this.countdown = this.countdownDuration; 
    this.countdown$.next(this.countdown);
  }

  resetCountdown(): void {
    this.countdown = this.countdownDuration;
    this.countdown$.next(this.countdown);
    this.startCountdown();
  }

  pauseCountdown(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  resumeCountdown(): void {
    if (this.countdown > 0) {
      this.timerSubscription = interval(1000)
        .pipe(takeWhile(() => this.countdown > 0))
        .subscribe(() => {
          this.countdown--;
          this.countdown$.next(this.countdown);
        });
    }
  }
}
