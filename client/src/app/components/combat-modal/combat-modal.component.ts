import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { CombatService } from '@app/services/combat/combat.service';
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

    @Input() gameId: string;

    currentTurnPlayerId: string;

    @Input() player: Player;
    @Input() opponent: Player;
    playerLife: number;
    opponentLife: number;

    combatRoomId: string;

    socketSubscription: Subscription = new Subscription();

    @Inject(CombatService) private combatService: CombatService;

    constructor(private socketService: SocketService) {
        this.socketService = socketService;
    }

    ngOnInit() {
        this.configureCombatSocketFeatures();
        //get le nbr de vie des joueurs avant le combat
        this.getPlayersLife();
        //start le combat, le socket revoie le joueur qui commence
        this.requestCombatStart(this.gameId, this.opponent);
    }

    ngOnDestroy() {
        this.socketSubscription.unsubscribe();
    }
    //preset les niveaux de vie des joueurs du debut
    getPlayersLife(): void {
        this.playerLife = this.player.specs.life;
        this.opponentLife = this.opponent.specs.life;
    }
    updatePlayerStats() {
        this.player.specs.life = this.playerLife;
        this.opponent.specs.life = this.opponentLife;
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
                }
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ playerAttacked: Player }>('attackSuccess').subscribe((data) => {
                if (data.playerAttacked.socketId === this.opponent.socketId) this.opponent.specs.life -= 1;
                else if (data.playerAttacked.socketId === this.player.socketId) this.player.specs.life -= 1;
                this.currentTurnPlayerId = data.playerAttacked.socketId;
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<Player>('currentPlayer').subscribe((player: Player) => {
                this.opponent = player;
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ combatRoomId: string; message: string }>('combatStarted').subscribe((data) => {
                this.combatRoomId = data.combatRoomId;
                console.log(data.message);
            }),
        );
        this.socketSubscription.add(this.socketService.listen('playerDisconnected').subscribe(() => {}));
    }

    requestCombatStart(gameId: string, opponent: Player) {
        this.socketService.sendMessage('startCombat', { gameId: gameId, opponent: opponent });
    }

    //Check a qui est le tour true = joueur ayant start le combat, false = opponent
    isCombatPlayerTurn(): boolean {
        return this.currentTurnPlayerId === this.player.socketId;
    }

    attack() {
        if (this.isCombatPlayerTurn()) {
            this.combatService.rollDice(this.player, this.opponent);
            this.socketService.sendMessage('attack', {
                attackPlayer: this.player,
                defendPlayer: this.opponent,
                gameId: this.gameId,
                playerDiceAttack: this.playerDiceAttack,
                opponentDiceDefense: this.opponentDiceDefense,
                combatRoomId: this.combatRoomId,
            });
        } else {
            this.combatService.rollDice(this.opponent, this.player);
            this.socketService.sendMessage('attack', {
                attackPlayer: this.opponent,
                defendPlayer: this.player,
                gameId: this.gameId,
                playerDiceDefense: this.playerDiceDefense,
                opponentDiceAttack: this.opponentDiceAttack,
                combatRoomId: this.combatRoomId,
            });
        }
    }

    evade() {
        if (this.isCombatPlayerTurn() && this.player.specs.nEvasions <= 2) {
            this.player.specs.nEvasions += 1;
            this.socketService.sendMessage('startEvasion', {
                player: this.player,
                waitingPlayer: this.opponent,
                gameId: this.gameId,
                combatRoomId: this.combatRoomId,
            });
        } else if (!this.isCombatPlayerTurn() && this.opponent.specs.nEvasions <= 2) {
            this.opponent.specs.nEvasions += 1;
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
            this.socketService.sendMessage('combatFinishedNormal', {
                gameId: this.gameId,
                combatWinner: this.opponent,
                combatRoomId: this.combatRoomId,
            });
        } else if (this.opponent.specs.life === 0) {
            this.combatWinStatsUpdate(this.player, this.opponent);
            this.socketService.sendMessage('combatFinishedNormal', {
                gameId: this.gameId,
                combatWinner: this.player,
                combatRoomId: this.combatRoomId,
            });
        }
        this.updatePlayerStats();
        this.closeCombatModal();
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
