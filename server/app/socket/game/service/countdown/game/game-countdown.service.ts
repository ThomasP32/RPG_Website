import { Countdown } from '@app/socket/game/service/countdown/counter-interface';
import { Injectable } from '@nestjs/common';
import { interval } from 'rxjs';
import { Server } from 'socket.io';
import { EventEmitter } from 'stream';

@Injectable()
export class GameCountdownService extends EventEmitter {
    server: Server;

    private countdowns: Map<string, Countdown> = new Map();

    setServer(server: Server) {
        this.server = server;
    }

    initCountdown(id: string, duration: number): void {
        if (!this.countdowns.has(id)) {
            const countdown: Countdown = {
                duration: duration,
                remaining: duration,
            };
            this.countdowns.set(id, countdown);
        }
    }

    async startNewCountdown(id: string): Promise<void> {
        const countdown = this.countdowns.get(id);
        if (countdown) {
            this.resetTimerSubscription(id);
            countdown.remaining = countdown.duration;

            countdown.remaining = countdown.duration;

            let delay = 3;

            countdown.timerSubscription = interval(1000).subscribe(() => {
                if (delay >= 0) {
                    this.server.to(id).emit('delay', delay);

                    if (delay === 0) {
                        this.server.to(id).emit('startTurn');
                    }

                    delay--;
                } else {
                    if (countdown.remaining > 0) {
                        this.server.to(id).emit('secondPassed', countdown.remaining);
                        countdown.remaining--;
                    } else {
                        this.emit('timeout', id);
                        this.resetCountdown(id);
                    }
                }
            });
        }
    }

    resumeCountdown(id: string) {
        const countdown = this.countdowns.get(id);
        this.resetTimerSubscription(id);

        countdown.timerSubscription = interval(1000).subscribe(() => {
            const value = countdown.remaining;
            if (countdown.remaining-- === 0) {
                this.emit('timeout', id);
                this.resetCountdown(id);
            } else {
                this.server.to(id).emit('secondPassed', value);
            }
        });
    }

    pauseCountdown(id: string): void {
        const countdown = this.countdowns.get(id);
        if (countdown) {
            this.resetTimerSubscription(id);
            countdown.duration = countdown.remaining;
            this.server.to(id).emit('pausedCountDown', countdown.remaining);
        }
    }

    resetCountdown(id: string): void {
        const countdown = this.countdowns.get(id);
        if (countdown) {
            countdown.remaining = countdown.duration;
            this.resetTimerSubscription(id);
        }
    }

    resetTimerSubscription(id: string): void {
        const countdown = this.countdowns.get(id);
        if (countdown && countdown.timerSubscription) {
            countdown.timerSubscription.unsubscribe();
            countdown.timerSubscription = undefined;
        }
    }
}
