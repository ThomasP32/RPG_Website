import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CombatCountdownService } from '@app/services/countdown/combat/combat-countdown.service';
import { GameService } from '@app/services/game/game.service';
import { RollResult } from '@common/combat';
import { CombatEvents } from '@common/events/combat.events';
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
        private readonly socketService: SocketService,
        private readonly combatCountDownService: CombatCountdownService,
        private readonly gameService: GameService,
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
            return `C'est à votre tour de jouer!`;
        } else {
            return `${this.opponent.name} est entrain de jouer.`;
        }
    }

    attack(): void {
        if (this.isYourTurn) {
            this.socketService.sendMessage(CombatEvents.Attack, this.gameService.game.id);
            this.isYourTurn = false;
        }
    }

    evade(): void {
        if (this.isYourTurn) {
            this.socketService.sendMessage(CombatEvents.StartEvasion, this.gameService.game.id);
            this.isYourTurn = false;
        }
    }

    isItYourTurn(): boolean {
        return !this.isYourTurn;
    }

    listenForAttacks(): void {
        this.socketSubscription.add(
            this.socketService.listen<Player>(CombatEvents.AttackSuccess).subscribe((playerAttacked) => {
                if (playerAttacked.socketId === this.opponent.socketId) this.opponent = playerAttacked;
                else if (playerAttacked.socketId === this.player.socketId) this.player = playerAttacked;

                if (playerAttacked.socketId === this.opponent.socketId) {
                    this.combatMessage = `Vous avez attaqué ${this.opponent.name}`;
                } else {
                    this.combatMessage = `${this.opponent.name} vous a attaqué`;
                }
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Player>(CombatEvents.AttackFailure).subscribe((playerAttacked) => {
                if (playerAttacked.socketId === this.opponent.socketId) {
                    this.combatMessage = `${playerAttacked.name} a survécu à votre attaque`;
                } else {
                    this.combatMessage = `Vous avez survécu à une attaque`;
                }
            }),
        );
    }

    listenForOpponent(): void {
        this.socketSubscription.add(
            this.socketService.listen<Player>(CombatEvents.CurrentPlayer).subscribe((player: Player) => {
                this.opponent = player;
            }),
        );
    }

    listenForCombatTurns(): void {
        this.socketSubscription.add(
            this.socketService.listen(CombatEvents.YourTurnCombat).subscribe(() => {
                this.isYourTurn = true;
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen(CombatEvents.PlayerTurnCombat).subscribe(() => {
                this.isYourTurn = false;
            }),
        );
    }

    listenForDiceRoll(): void {
        this.socketSubscription.add(
            this.socketService.listen<RollResult>(CombatEvents.DiceRolled).subscribe((rollResult) => {
                this.defenseTotal = rollResult.defenseDice;
                this.attackTotal = rollResult.attackDice;
                if (this.isYourTurn) {
                    this.attacking = true;
                } else {
                    this.attackTotal = rollResult.defenseDice;
                    this.defenseTotal = rollResult.attackDice;
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
