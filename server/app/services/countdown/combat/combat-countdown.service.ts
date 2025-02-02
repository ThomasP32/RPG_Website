import { Countdown } from '@app/services/countdown/counter-interface';
import { COUNTDOWN_COMBAT_DURATION, COUNTDOWN_INTERVAL, COUNTDOWN_NOEVASION_DURATION } from '@common/constants';
import { CountdownEvents } from '@common/events/countdown.events';
import { Game } from '@common/game';
import { Injectable } from '@nestjs/common';
import { interval } from 'rxjs';
import { Server } from 'socket.io';
import { EventEmitter } from 'stream';

@Injectable()
export class CombatCountdownService extends EventEmitter {
    private server: Server;
    private readonly countdowns: Map<string, Countdown> = new Map();

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

    async startTurnCounter(game: Game, hasEvasions: boolean): Promise<void> {
        const duration = hasEvasions ? COUNTDOWN_COMBAT_DURATION : COUNTDOWN_NOEVASION_DURATION;
        let countdown = this.countdowns.get(game.id);

        if (!countdown) {
            this.initCountdown(game.id, duration);
            countdown = this.countdowns.get(game.id)!;
        } else {
            countdown.duration = duration;
            countdown.remaining = duration;
        }
        this.resetTimerSubscription(game.id);

        countdown.timerSubscription = interval(COUNTDOWN_INTERVAL).subscribe(() => {
            const value = countdown.remaining;
            if (countdown.remaining-- === 0) {
                this.emit(CountdownEvents.Timeout, game.id);
            } else {
                game.duration++;
                this.server.to(game.id).emit(CountdownEvents.CombatSecondPassed, value);
            }
        });
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
