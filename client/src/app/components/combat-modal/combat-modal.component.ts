import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Player } from '@common/game';
import { Subscription } from 'rxjs';

@Component({
    standalone: true,
    selector: 'app-combat-modal',
    templateUrl: './combat-modal.component.html',
    styleUrls: ['./combat-modal.component.scss'],
})
export class CombatModalComponent implements OnInit, OnDestroy {
    playerDiceAttack: number;
    playerDiceDefense: number;
    opponentDiceAttack: number;
    opponentDiceDefense: number;
    diceRollReceived = false;
    actionButtonsOn = false;
    attacking = false;

    attackTotal: number;
    defenseTotal: number;

    @Input() gameId: string;

    currentTurnPlayerId: string;

    @Input() player: Player;
    @Input() opponent: Player;
    playerLife: number;
    opponentLife: number;

    @Input() combatRoomId: string;

    socketSubscription: Subscription = new Subscription();

    // @Inject(CombatService) private combatService: CombatService;

    constructor(
        private socketService: SocketService,
        private cdr: ChangeDetectorRef,
    ) {
        this.socketService = socketService;
    }

    ngOnInit() {
        this.configureCombatSocketFeatures();
        this.getPlayersLife();
    }

    ngOnDestroy() {
        this.socketSubscription.unsubscribe();
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
            this.socketService.listen<{ currentPlayerTurn: string }>('updateTurn').subscribe((data) => {
                this.currentTurnPlayerId = data.currentPlayerTurn;
                console.log('Current turn player:', this.currentTurnPlayerId);
                this.cdr.detectChanges();
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ success: boolean; waitingPlayer: Player }>('evasionSuccess').subscribe((data) => {
                if (data.success) {
                    this.combatFinishedByEvasion();
                } else {
                    this.currentTurnPlayerId = data.waitingPlayer.socketId;
                    console.log('change of turn', this.currentTurnPlayerId);
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
                    if (this.isCombatPlayerTurn()) {
                        this.attacking = true;
                    } else {
                        this.attackTotal = data.defenseDice;
                        this.defenseTotal = data.attackDice;
                        this.attacking = false;
                    }
                }),
        );

        this.socketSubscription.add(
            this.socketService.listen<{ playerAttacked: Player }>('attackSuccess').subscribe((data) => {
                if (data.playerAttacked.socketId === this.opponent.socketId) this.opponent.specs.life -= 1;
                else if (data.playerAttacked.socketId === this.player.socketId) this.player.specs.life -= 1;
                if (this.player.specs.life === 0 || this.opponent.specs.life === 0) {
                    this.combatFinishedNormal();
                }
                this.currentTurnPlayerId = data.playerAttacked.socketId;
                console.log('Attack success, change of turn', this.currentTurnPlayerId);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ playerAttacked: Player }>('attackFailure').subscribe((data) => {
                this.currentTurnPlayerId = data.playerAttacked.socketId;
                console.log('Attack failure, change of turn', this.currentTurnPlayerId);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<Player>('currentPlayer').subscribe((player: Player) => {
                this.opponent = player;
            }),
        );
        this.socketSubscription.add(this.socketService.listen('playerDisconnected').subscribe(() => {}));
    }

    isCombatPlayerTurn(): boolean {
        return this.currentTurnPlayerId === this.player.socketId;
    }

    getDiceRolls(player: Player, opponent: Player) {
        this.socketService.sendMessage('rollDice', {
            combatRoomId: this.combatRoomId,
            player: player,
            opponent: opponent,
        });
    }

    attack() {
        if (this.isCombatPlayerTurn()) {
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
        // } else {
        //     this.getDiceRolls(this.opponent, this.player);
        //     const interval = setInterval(() => {
        //         if (this.diceRollReceived) {
        //             clearInterval(interval);
        //             this.socketService.sendMessage('attack', {
        //                 attackPlayer: this.opponent,
        //                 defendPlayer: this.player,
        //                 combatRoomId: this.combatRoomId,
        //                 attackDice: this.opponentDiceAttack,
        //                 defenseDice: this.playerDiceDefense,
        //             });
        //         }
        //     }, 100);
        // }
    }

    evade() {
        if (this.isCombatPlayerTurn() && this.player.specs.nEvasions > 0) {
            this.player.specs.nEvasions -= 1;
            this.socketService.sendMessage('startEvasion', {
                player: this.player,
                waitingPlayer: this.opponent,
                gameId: this.gameId,
                combatRoomId: this.combatRoomId,
            });
            // } else if (!this.isCombatPlayerTurn() && this.opponent.specs.nEvasions > 0) {
            //     this.opponent.specs.nEvasions -= 1;
            //     this.socketService.sendMessage('startEvasion', {
            //         player: this.opponent,
            //         waitingPlayer: this.player,
            //         gameId: this.gameId,
            //         combatRoomId: this.combatRoomId,
            //     });
        }
    }
    combatWinStatsUpdate(winner: Player, loser: Player) {
        winner.specs.nVictories += 1;
        winner.specs.nCombats += 1;
        loser.specs.nDefeats += 1;
        loser.specs.nCombats += 1;
    }
    combatFinishedNormal() {
        if (this.player.specs.life === 0) {
            this.combatWinStatsUpdate(this.opponent, this.player);
            this.updatePlayerStats();
            this.closeCombatModal();
            this.socketService.sendMessage('combatFinishedNormal', {
                gameId: this.gameId,
                combatWinner: this.opponent,
                combatLooser: this.player,
                combatRoomId: this.combatRoomId,
            });
            // } else if (this.opponent.specs.life === 0) {
            //     this.combatWinStatsUpdate(this.player, this.opponent);
            //     this.updatePlayerStats();
            //     this.closeCombatModal();
            //     this.socketService.sendMessage('combatFinishedNormal', {
            //         gameId: this.gameId,
            //         combatWinner: this.player,
            //         combatLooser: this.opponent,
            //         combatRoomId: this.combatRoomId,
            //     });
        }
    }

    combatFinishedByEvasion() {
        this.socketService.sendMessage('combatFinishedEvasion', {
            gameId: this.gameId,
            player1: this.player,
            player2: this.opponent,
            combatRoomId: this.combatRoomId,
        });
        this.updatePlayerStats();
        this.closeCombatModal();
    }

    closeCombatModal() {
        this.combatRoomId = '';
        this.currentTurnPlayerId = '';
    }
    get turnMessage(): string {
        if (this.currentTurnPlayerId === this.player.socketId) {
            return `${this.player.name} joue présentement.`;
        } else if (this.currentTurnPlayerId === this.opponent.socketId) {
            return `${this.opponent.name} joue présentement.`;
        } else {
            return '';
        }
    }

    getActionsButtonsOnTurn(): void {
        if (this.currentTurnPlayerId === this.player.socketId) this.actionButtonsOn = true;
        else this.actionButtonsOn = false;
    }
}
