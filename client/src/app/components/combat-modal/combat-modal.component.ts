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
    countdown: number;
    playerDiceAttack: number;
    playerDiceDefense: number;
    opponentDiceAttack: number;
    opponentDiceDefense: number;
    diceRollReceived = false;
    actionButtonsOn = false;
    attacking = false;
    combatMessage: string;

    attackTotal: number;
    defenseTotal: number;

    isYourTurn: boolean;

    @Input() player: Player;
    @Input() opponent: Player;
    playerLife: number;
    opponentLife: number;

    @Input() gameId: string;
    @Input() combatRoomId: string;

    socketSubscription: Subscription = new Subscription();

    // @Inject(CombatService) private combatService: CombatService;

    constructor(
        private socketService: SocketService,
        private combatCountDownService: CombatCountdownService,
        private gameService: GameService
    ) {
        this.socketService = socketService;
        this.gameService = gameService;
        this.combatCountDownService = combatCountDownService;
    }

    ngOnInit() {
        this.configureCombatSocketFeatures();
        this.getPlayersLife();
        this.listenForCountdown();
    }

    ngOnDestroy() {
        this.socketSubscription.unsubscribe();
    }

    listenForCountdown() {
        this.combatCountDownService.combatCountdown$.subscribe((timeLeft: number) => {
            console.log('le temps restant', timeLeft);
            this.countdown = timeLeft;
        });
    }
    //preset les niveaux de vie des joueurs du debut
    getPlayersLife(): void {
        this.playerLife = this.player.specs.life;
        this.opponentLife = this.opponent.specs.life;
        this.player.specs.nEvasions = 2;
        this.opponent.specs.nEvasions = 2;
    }
    updatePlayerStats() {
        this.player.specs.life = this.playerLife;
        this.opponent.specs.life = this.opponentLife;
        this.player.specs.nEvasions = 2;
        this.opponent.specs.nEvasions = 2;
    }

    configureCombatSocketFeatures(): void {
        this.socketSubscription.add(
            this.socketService.listen<{ success: boolean; waitingPlayer: Player; message: string }>('evasionSuccess').subscribe((data) => {
                if (data.success) {
                    this.combatMessage = data.message;
                    // this.combatFinishedByEvasion();
                } else {
                    if (data.waitingPlayer.socketId === this.opponent.socketId) this.player.specs.nEvasions -= 1;
                    else if (data.waitingPlayer.socketId === this.player.socketId) this.opponent.specs.nEvasions -= 1;
                    this.combatMessage = data.message;
                }
            }),
        );
        this.socketSubscription.add(
            this.socketService
                .listen<{
                    playerDiceAttack: number;
                    playerDiceDefense: number;
                    opponentDiceAttack: number;
                    opponentDiceDefense: number;
                    attackDice: number;
                    defenseDice: number;
                }>('diceRolled')
                .subscribe((data) => {
                    this.playerDiceAttack = data.playerDiceAttack;
                    this.playerDiceDefense = data.playerDiceDefense;
                    this.opponentDiceAttack = data.opponentDiceAttack;
                    this.opponentDiceDefense = data.opponentDiceDefense;
                    this.defenseTotal = data.defenseDice;
                    this.attackTotal = data.attackDice;
                    this.diceRollReceived = true;
                    if (this.isYourTurn) {
                        this.attacking = true;
                    } else {
                        this.attackTotal = data.defenseDice;
                        this.defenseTotal = data.attackDice;
                        this.attacking = false;
                    }
                }),
        );

        this.socketSubscription.add(
            this.socketService.listen<{ playerAttacked: Player; message: string }>('attackSuccess').subscribe((data) => {
                if (data.playerAttacked.socketId === this.opponent.socketId) this.opponent.specs.life -= 1;
                else if (data.playerAttacked.socketId === this.player.socketId) this.player.specs.life -= 1;
                this.combatMessage = data.message;
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ message: string }>('attackFailure').subscribe((data) => {
                this.combatMessage = data.message;
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<Player>('currentPlayer').subscribe((player: Player) => {
                this.opponent = player;
            }),
        );
        //TODO: a revoir pense pas cest accurate
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

    getDiceRolls(player: Player, opponent: Player) {
        this.socketService.sendMessage('rollDice', {
            combatRoomId: this.combatRoomId,
            player: player,
            opponent: opponent,
        });
    }

    attack() {
        if (this.isYourTurn) {
            this.getDiceRolls(this.player, this.opponent);
            const interval = setInterval(() => {
                if (this.diceRollReceived) {
                    clearInterval(interval);
                    this.socketService.sendMessage('attack', {
                        attackPlayer: this.player,
                        defendPlayer: this.opponent,
                        combatRoomId: this.combatRoomId,
                        attackDice: this.playerDiceAttack,
                        defenseDice: this.opponentDiceDefense,
                    });
                }
            }, 100);
        }
    }

    evade() {
        console.log('tu tentes de tevader');
        this.socketService.sendMessage('startEvasion', {
            player: this.player,
            waitingPlayer: this.opponent,
            gameId: this.gameService.game.id,
            combatRoomId: this.combatRoomId,
        });
    }
    get turnMessage(): string {
        if (this.isYourTurn) {
            return `${this.player.name} joue présentement.`;
        } else {
            return `${this.opponent.name} joue présentement.`;
        }
    }

    getActionsButtonsOnTurn(): void {
        if (this.isYourTurn) this.actionButtonsOn = true;
        else this.actionButtonsOn = false;
    }
}

// combatFinishedNormal() {
//     if (this.player.specs.life === 0) {
//         this.combatWinStatsUpdate(this.opponent, this.player);
//         this.updatePlayerStats();
//         this.socketService.sendMessage('combatFinishedNormal', {
//             gameId: this.gameService.game.id,
//             combatWinner: this.opponent,
//             combatLooser: this.player,
//             combatRoomId: this.combatRoomId,
//         });
//         this.closeCombatModal();
//     }
// }

// combatFinishedByEvasion() {
//     this.socketService.sendMessage('combatFinishedEvasion', {
//         gameId: this.gameService.game.id,
//         player1: this.player,
//         player2: this.opponent,
//         combatRoomId: this.combatRoomId,
//     });
//     this.updatePlayerStats();
//     this.closeCombatModal();
// }

// closeCombatModal() {
//     this.combatRoomId = '';
// }
