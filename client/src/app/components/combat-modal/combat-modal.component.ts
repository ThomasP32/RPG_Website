import { Component, Input, OnDestroy, OnInit } from '@angular/core';
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

    @Input() gameId: string;

    currentTurnPlayerId: string;

    @Input() player: Player;
    @Input() opponent: Player;
    playerLife: number;
    opponentLife: number;

    @Input() combatRoomId: string;

    socketSubscription: Subscription = new Subscription();

    // @Inject(CombatService) private combatService: CombatService;

    constructor(private socketService: SocketService) {
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
                .listen<{ playerDiceAttack: number; playerDiceDefense: number; opponentDiceAttack: number; opponentDiceDefense: number }>(
                    'diceRolled',
                )
                .subscribe((data) => {
                    this.playerDiceAttack = data.playerDiceAttack;
                    this.playerDiceDefense = data.playerDiceDefense;
                    this.opponentDiceAttack = data.opponentDiceAttack;
                    this.opponentDiceDefense = data.opponentDiceDefense;
                    this.diceRollReceived = true;
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
            this.socketService.listen<Player>('currentPlayer').subscribe((player: Player) => {
                this.opponent = player;
            }),
        );
        this.socketSubscription.add(this.socketService.listen('playerDisconnected').subscribe(() => {}));
    }

    //Check a qui est le tour true = joueur ayant start le combat, false = opponent
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
        } else {
            this.getDiceRolls(this.opponent, this.player);
            const interval = setInterval(() => {
                if (this.diceRollReceived) {
                    clearInterval(interval);
                    this.socketService.sendMessage('attack', {
                        attackPlayer: this.opponent,
                        defendPlayer: this.player,
                        combatRoomId: this.combatRoomId,
                        attackDice: this.opponentDiceAttack,
                        defenseDice: this.playerDiceDefense,
                    });
                }
            }, 100);
        }
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
        } else if (!this.isCombatPlayerTurn() && this.opponent.specs.nEvasions > 0) {
            this.opponent.specs.nEvasions -= 1;
            this.socketService.sendMessage('startEvasion', {
                player: this.opponent,
                waitingPlayer: this.player,
                gameId: this.gameId,
                combatRoomId: this.combatRoomId,
            });
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
        } else if (this.opponent.specs.life === 0) {
            this.combatWinStatsUpdate(this.player, this.opponent);
            this.updatePlayerStats();
            this.closeCombatModal();
            this.socketService.sendMessage('combatFinishedNormal', {
                gameId: this.gameId,
                combatWinner: this.player,
                combatLooser: this.opponent,
                combatRoomId: this.combatRoomId,
            });
        }
        // this.socketService.sendMessage('updatePlayersAfterCombat', {
        //     gameId: this.gameId,
        //     player1: this.player,
        //     player2: this.opponent,
        // });
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
}

//combat start
// front end envoie les 2 joueurs en combat + le gameName ou gameId
// 1. getCombatPlayers()
// 2. remplir player1 et player2

// 1. getplayers (active)
// 2. listen to combatStart -- push button start combat -> emit combatStart-> serveur recoit les 2 joueurs, envoie invite aux 2 joueurs avec une reponse combat start html pop pour seulement 2 joueurs impliques

// //after combat
// 3. emit updatePlayer(player1) : player.id, player.specs.combats + 1, player.specs.evasions,
