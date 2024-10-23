import { Component, OnInit } from '@angular/core';
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
export class CombatModalComponent implements OnInit {
    isOpenCombatModal: boolean = true;

    dice: Dice;
    player1Dice: number;
    player2Dice: number;

    //TODO: get gameId from game
    gameId: string;

    currentTurnPlayerId: string;

    startCombatPlayer: Player;
    startCombatPlayerLife: number;
    player2: Player;
    player2Life: number;

    socketSubscription: Subscription = new Subscription();

    constructor(private socketService: SocketService) {
        this.dice = new Dice();
    }

    ngOnInit() {
        this.configureCombatSocketFeatures();
        //get le nbr de vie des joueurs avant le combat
        this.getPlayersLife();
        //start le combat, le socket revoie le joueur qui commence
        this.requestCombatStart(this.gameId, this.startCombatPlayer, this.player2);
    }

    ngOnDestroy() {
        this.socketSubscription.unsubscribe();
    }

    configureCombatSocketFeatures(): void {
        this.socketSubscription.add(
            this.socketService.listen<{ currentPlayerTurn: string }>('updateTurn').subscribe((data) => {
                this.currentTurnPlayerId = data.currentPlayerTurn;
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ success: boolean }>('evasionSuccess').subscribe((data) => {
                this.combatFinishedByEvasion(data.success);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ playerAttacked: Player }>('attackSuccess').subscribe((data) => {
                if (data.playerAttacked.socketId === this.player2.socketId) this.player2.specs.life -= 1;
                else if (data.playerAttacked.socketId === this.startCombatPlayer.socketId) this.startCombatPlayer.specs.life -= 1;
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

    requestCombatStart(gameId: string, startCombatPlayer: Player, player2: Player) {
        this.socketService.sendMessage('startCombat', { gameId: gameId, startCombatPlayer: startCombatPlayer, player2: player2 });
        this.isOpenCombatModal = true;
    }

    // requestGamePlayers(gameId: string) {
    //     this.socketService.sendMessage('getPlayers', gameId);
    // }

    // requestCombatPlayers(gameId: string) {
    //     // this.socketService.sendMessage('combatPlayer', { player: GameComponent.playerPressedCombatButton, gameId });
    // }

    getPlayersLife() {
        this.startCombatPlayerLife = this.startCombatPlayer.specs.life;
        this.player2Life = this.player2.specs.life;
    }

    isCombatPlayerTurn(): boolean {
        return this.currentTurnPlayerId === this.startCombatPlayer.socketId;
    }

    rollDice(): void {
        this.player1Dice = this.dice.roll();
        this.player2Dice = this.dice.roll();
    }

    attack() {
        if (this.isCombatPlayerTurn()) {
            this.rollDice();
            this.socketService.sendMessage('attack', {
                attackPlayer: this.startCombatPlayer,
                defendPlayer: this.player2,
                gameId: this.gameId,
                player1Dice: this.player1Dice,
                player2Dice: this.player2Dice,
            });
        } else {
            this.rollDice();
            this.socketService.sendMessage('attack', {
                attackPlayer: this.player2,
                defendPlayer: this.startCombatPlayer,
                gameId: this.gameId,
                player1Dice: this.player1Dice,
                player2Dice: this.player2Dice,
            });
        }
    }

    evade() {
        if (this.isCombatPlayerTurn() && this.startCombatPlayer.specs.nEvasions <= 2) {
            this.startCombatPlayer.specs.nEvasions += 1;
            this.socketService.sendMessage('startEvasion', { player: this.startCombatPlayer, gameId: this.gameId });
        } else if (!this.isCombatPlayerTurn() && this.player2.specs.nEvasions <= 2) {
            this.player2.specs.nEvasions += 1;
            this.socketService.sendMessage('startEvasion', { player: this.player2, gameId: this.gameId });
        }
    }
    combatWinStatsUpdate(winner: Player, loser: Player) {
        winner.specs.nVictories += 1;
        winner.specs.nCombats += 1;
        loser.specs.nDefeats += 1;
        loser.specs.nCombats += 1;
    }
    combatFinishedNormal() {
        if ((this.startCombatPlayer.specs.life = 0)) {
            this.combatWinStatsUpdate(this.player2, this.startCombatPlayer);
            this.socketService.sendMessage('combatFinishedNormal', {
                gameId: this.gameId,
                combatWinner: this.player2,
            });
        } else if ((this.player2.specs.life = 0)) {
            this.combatWinStatsUpdate(this.startCombatPlayer, this.player2);
            this.socketService.sendMessage('combatFinishedNormal', {
                gameId: this.gameId,
                combatWinner: this.startCombatPlayer,
            });
        }
        this.updatePlayerStats(this.startCombatPlayer, this.player2);
        this.isOpenCombatModal = false;
    }

    combatFinishedByEvasion(evasion: boolean) {
        this.socketService.sendMessage('combatFinishedEvasion', {
            gameId: this.gameId,
            evasion,
            startCombatPlayer: this.startCombatPlayer,
            player2: this.player2,
        });
        this.updatePlayerStats(this.startCombatPlayer, this.player2);
        this.isOpenCombatModal = false;
    }

    updatePlayerStats(player1: Player, player2: Player) {
        player1.specs.life = this.startCombatPlayerLife;
        player2.specs.life = this.player2Life;
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
