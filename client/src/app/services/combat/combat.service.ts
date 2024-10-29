import { Injectable } from '@angular/core';
import { Player } from '@common/game';

@Injectable({
    providedIn: 'root',
})
export class CombatService {
    playerLife: number;
    opponentLife: number;

    constructor() {}

    rollDice(attackingPlayer: Player, opponent: Player): void {
        attackingPlayer.specs.attackBonus.currentValue = Math.floor(Math.random() * attackingPlayer.specs.attackBonus.diceType) + 1;
        attackingPlayer.specs.defenseBonus.currentValue = Math.floor(Math.random() * attackingPlayer.specs.defenseBonus.diceType) + 1;
        opponent.specs.attackBonus.currentValue = Math.floor(Math.random() * opponent.specs.attackBonus.diceType) + 1;
        opponent.specs.defenseBonus.currentValue = Math.floor(Math.random() * opponent.specs.defenseBonus.diceType) + 1;
    }
    //preset les niveaux de vie des joueurs du debut
    getPlayersLife(player: Player, opponent: Player): void {
        this.playerLife = player.specs.life;
        this.opponentLife = opponent.specs.life;
    }
    updatePlayerStats(player1: Player, player2: Player) {
        player1.specs.life = this.playerLife;
        player2.specs.life = this.opponentLife;
    }
}
