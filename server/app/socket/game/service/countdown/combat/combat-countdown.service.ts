import { Countdown } from '@app/socket/game/service/countdown/counter-interface';
import { Injectable } from '@nestjs/common';
import { interval } from 'rxjs';
import { Server } from 'socket.io';
import { EventEmitter } from 'stream';

@Injectable()
export class CombatCountdownService extends EventEmitter {
    private server: Server;
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

    async startTurnCounter(id: string, hasEvasions: boolean): Promise<void> {
        const duration = hasEvasions ? 5 : 3;
        let countdown = this.countdowns.get(id);

        if (!countdown) {
            this.initCountdown(id, duration);
            countdown = this.countdowns.get(id)!;
        } else {
            countdown.duration = duration;
            countdown.remaining = duration;
        }
        this.resetTimerSubscription(id);

        countdown.timerSubscription = interval(1000).subscribe(() => {
            const value = countdown.remaining;
            if (countdown.remaining-- === 0) {
                this.emit('timeout', id);
            } else {
                this.server.to(id).emit('combatSecondPassed', value);
            }
        });
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
