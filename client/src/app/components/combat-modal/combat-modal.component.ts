import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Player } from '@common/game';
import { Subscription } from 'rxjs';

class Dice {
    currentFace: number;
    constructor() {
        this.roll();
    }
    roll() {
        return Math.floor(Math.random() * 6) + 1;
    }
}

@Component({
    standalone: true,
    selector: 'app-combat-modal',
    templateUrl: './combat-modal.component.html',
    styleUrls: ['./combat-modal.component.scss'],
})
export class CombatModalComponent implements OnInit, OnDestroy {
    isOpenCombatModal: boolean = true;

    dice: Dice;
    player1Dice: number;
    player2Dice: number;

    @Input() gameId: string;

    currentTurnPlayerId: string;

    @Input() player: Player;
    playerLife: number;
    @Input() opponent: Player;
    opponentLife: number;

    combatRoomId: string;

    socketSubscription: Subscription = new Subscription();

    constructor(private socketService: SocketService) {
        this.socketService = socketService;
        this.dice = new Dice();
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

    configureCombatSocketFeatures(): void {
        this.socketSubscription.add(
            this.socketService.listen<{ currentPlayerTurn: string }>('updateTurn').subscribe((data) => {
                this.currentTurnPlayerId = data.currentPlayerTurn;
                console.log('Current turn player:', this.currentTurnPlayerId);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ success: boolean }>('evasionSuccess').subscribe((data) => {
                this.combatFinishedByEvasion(data.success);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ playerAttacked: Player }>('attackSuccess').subscribe((data) => {
                if (data.playerAttacked.socketId === this.opponent.socketId) this.opponent.specs.life -= 1;
                else if (data.playerAttacked.socketId === this.player.socketId) this.player.specs.life -= 1;
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

        // this.socketSubscription.add(
        //     this.socketService.listen<Player[]>('currentPlayers').subscribe((players: Player[]) => {
        //         console.log(players);
        //     }),
        // );
        // this.socketSubscription.add(
        //     this.socketService.listen('gameNotFound').subscribe(() => {
        //         console.log('game not found');
        //     }),
        // );
        // this.socketSubscription.add(
        //     this.socketService.listen('currentCombatPlayer').subscribe((player: Player) => {
        //         console.log(player);
        //     }),
        // );
    }

    requestCombatStart(gameId: string, opponent: Player) {
        this.socketService.sendMessage('startCombat', { gameId: gameId, opponent: opponent });
        this.isOpenCombatModal = true;
    }

    // requestPlayerById(gameId: string, playerSocketId: string) {
    //     this.socketService.sendMessage('getPlayerById', { gameId: gameId, playerSocketId: playerSocketId });
    // }

    // requestGamePlayers(gameId: string) {
    //     this.socketService.sendMessage('getPlayers', gameId);
    // }

    // requestCombatPlayers(gameId: string) {
    //     // this.socketService.sendMessage('combatPlayer', { player: GameComponent.playerPressedCombatButton, gameId });
    // }

    getPlayersLife() {
        this.playerLife = this.player.specs.life;
        this.opponentLife = this.opponent.specs.life;
    }

    isCombatPlayerTurn(): boolean {
        return this.currentTurnPlayerId === this.player.socketId;
    }

    rollDice(): void {
        this.player1Dice = this.dice.roll();
        this.player2Dice = this.dice.roll();
    }

    attack() {
        if (this.isCombatPlayerTurn()) {
            this.rollDice();
            this.socketService.sendMessage('attack', {
                attackPlayer: this.player,
                defendPlayer: this.opponent,
                gameId: this.gameId,
                player1Dice: this.player1Dice,
                player2Dice: this.player2Dice,
                combatRoomId: this.combatRoomId,
            });
        } else {
            this.rollDice();
            this.socketService.sendMessage('attack', {
                attackPlayer: this.opponent,
                defendPlayer: this.player,
                gameId: this.gameId,
                player1Dice: this.player1Dice,
                player2Dice: this.player2Dice,
                combatRoomId: this.combatRoomId,
            });
        }
    }

    evade() {
        if (this.isCombatPlayerTurn() && this.player.specs.nEvasions <= 2) {
            this.player.specs.nEvasions += 1;
            this.socketService.sendMessage('startEvasion', { player: this.player, gameId: this.gameId, combatRoomId: this.combatRoomId });
        } else if (!this.isCombatPlayerTurn() && this.opponent.specs.nEvasions <= 2) {
            this.opponent.specs.nEvasions += 1;
            this.socketService.sendMessage('startEvasion', { player: this.opponent, gameId: this.gameId, combatRoomId: this.combatRoomId });
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
        this.updatePlayerStats(this.player, this.opponent);
        this.closeCombatModal();
    }

    combatFinishedByEvasion(evasion: boolean) {
        this.socketService.sendMessage('combatFinishedEvasion', {
            gameId: this.gameId,
            evasion,
            startCombatPlayer: this.player,
            player2: this.opponent,
            combatRoomId: this.combatRoomId,
        });
        this.updatePlayerStats(this.player, this.opponent);
        this.closeCombatModal();
    }

    updatePlayerStats(player1: Player, player2: Player) {
        player1.specs.life = this.playerLife;
        player2.specs.life = this.opponentLife;
    }

    closeCombatModal() {
        this.combatRoomId = '';
        this.currentTurnPlayerId = '';
        this.isOpenCombatModal = false;
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
