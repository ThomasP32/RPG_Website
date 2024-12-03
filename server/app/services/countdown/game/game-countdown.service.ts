import { Countdown } from '@app/services/countdown/counter-interface';
import { COUNTDOWN_INTERVAL, DELAY } from '@common/constants';
import { Game } from '@common/game';
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

    async startNewCountdown(game: Game): Promise<void> {
        const countdown = this.countdowns.get(game.id);
        if (countdown) {
            this.resetTimerSubscription(game.id);
            countdown.remaining = countdown.duration;

            let delay = DELAY;

            countdown.timerSubscription = interval(COUNTDOWN_INTERVAL).subscribe(() => {
                if (delay >= 0) {
                    this.server.to(game.id).emit('delay', delay);

                    if (delay === 0) {
                        this.server.to(game.id).emit('startTurn');
                    }

                    delay--;
                } else {
                    if (countdown.remaining > 0) {
                        this.server.to(game.id).emit('secondPassed', countdown.remaining);
                        countdown.remaining--;
                        game.duration++;
                    } else {
                        this.emit('timeout', game.id);
                    }
                }
            });
        }
    }

    resumeCountdown(id: string) {
        const countdown = this.countdowns.get(id);
        this.resetTimerSubscription(id);

        countdown.timerSubscription = interval(COUNTDOWN_INTERVAL).subscribe(() => {
            const value = countdown.remaining;
            if (countdown.remaining-- === 0) {
                this.emit('timeout', id);
            } else {
                this.server.to(id).emit('secondPassed', value);
            }
        });
    }

    pauseCountdown(id: string): void {
        const countdown = this.countdowns.get(id);
        if (countdown) {
            this.resetTimerSubscription(id);
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

    deleteCountdown(id: string): void {
        const countdown = this.countdowns.get(id);
        if (countdown) {
            this.resetTimerSubscription(id);
            this.countdowns.delete(id);
        }
    }
}
