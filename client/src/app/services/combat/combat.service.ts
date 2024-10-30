import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class CombatService {
    // private diceRollSource = new BehaviorSubject<{
    //     attackingPlayerAttackDice: number;
    //     attackingPlayerDefenseDice: number;
    //     opponentAttackDice: number;
    //     opponentDefenseDice: number;
    // }>({
    //     attackingPlayerAttackDice: 0,
    //     attackingPlayerDefenseDice: 0,
    //     opponentAttackDice: 0,
    //     opponentDefenseDice: 0,
    // });
    // diceRoll$ = this.diceRollSource.asObservable();
    // rollDice(attackingPlayer: Player, opponent: Player): void {
    //     const diceRoll = {
    //         attackingPlayerAttackDice: Math.floor(Math.random() * attackingPlayer.specs.attackBonus) + 1,
    //         attackingPlayerDefenseDice: Math.floor(Math.random() * attackingPlayer.specs.defenseBonus) + 1,
    //         opponentAttackDice: Math.floor(Math.random() * opponent.specs.attackBonus) + 1,
    //         opponentDefenseDice: Math.floor(Math.random() * opponent.specs.defenseBonus) + 1,
    //     };
    //     this.diceRollSource.next(diceRoll);
    // }
}
