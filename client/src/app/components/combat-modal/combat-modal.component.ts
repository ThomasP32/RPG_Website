import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CombatCountdownService } from '@app/services/countdown/combat/combat-countdown.service';
import { GameService } from '@app/services/game/game.service';
import { Player } from '@common/game';
import { Subscription } from 'rxjs';

@Component({
    standalone: true,
    selector: 'app-combat-modal',
    templateUrl: './combat-modal.component.html',
    styleUrls: ['./combat-modal.component.scss'],
})
export class CombatModalComponent implements OnInit, OnDestroy {
    @Input() player: Player;
    @Input() opponent: Player;

    countdown: number;
    combatMessage: string;

    attackTotal: number;
    defenseTotal: number;

    attacking = false;
    isYourTurn: boolean;

    socketSubscription: Subscription = new Subscription();

    constructor(
        private socketService: SocketService,
        private combatCountDownService: CombatCountdownService,
        private gameService: GameService,
    ) {
        this.socketService = socketService;
        this.combatCountDownService = combatCountDownService;
        this.gameService = gameService;
    }

    ngOnInit() {
        this.listenForAttacks();
        this.listenForCombatTurns();
        this.listenForCountdown();
        this.listenForDiceRoll();
    }

    get turnMessage(): string {
        if (this.isYourTurn) {
            return `${this.player.name} joue présentement.`;
        } else {
            return `${this.opponent.name} joue présentement.`;
        }
    }

    attack(): void {
        if (this.isYourTurn) {
            this.socketService.sendMessage('attack', this.gameService.game.id);
        }
    }

    evade(): void {
        this.socketService.sendMessage('startEvasion', this.gameService.game.id);
    }

    listenForAttacks(): void {
        this.socketSubscription.add(
            this.socketService.listen<Player>('attackSuccess').subscribe((playerAttacked) => {
                if (playerAttacked.socketId === this.opponent.socketId) this.opponent = playerAttacked;
                else if (playerAttacked.socketId === this.player.socketId) this.player = playerAttacked;
                this.combatMessage = `${playerAttacked.name} a succombé à une attaque`;
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Player>('attackFailure').subscribe((playerAttacked) => {
                this.combatMessage = `${playerAttacked.name} a survécu à une attaque`;
            }),
        );
    }

    listenForOpponent(): void {
        this.socketSubscription.add(
            this.socketService.listen<Player>('currentPlayer').subscribe((player: Player) => {
                this.opponent = player;
            }),
        );
    }

    listenForCombatTurns(): void {
        this.socketSubscription.add(
            this.socketService.listen('yourTurnCombat').subscribe(() => {
                this.isYourTurn = true;
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen('playerTurnCombat').subscribe(() => {
                this.isYourTurn = false;
            }),
        );
    }

    listenForDiceRoll(): void {
        this.socketSubscription.add(
            this.socketService.listen<{ attackDice: number; defenseDice: number }>('diceRolled').subscribe((data) => {
                this.defenseTotal = data.defenseDice;
                this.attackTotal = data.attackDice;
                if (this.isYourTurn) {
                    this.attacking = true;
                } else {
                    this.attackTotal = data.defenseDice;
                    this.defenseTotal = data.attackDice;
                    this.attacking = false;
                }
            }),
        );
    }

    listenForCountdown() {
        this.combatCountDownService.combatCountdown$.subscribe((timeLeft: number) => {
            this.countdown = timeLeft;
        });
    }

    ngOnDestroy() {
        this.socketSubscription.unsubscribe();
    }
}
