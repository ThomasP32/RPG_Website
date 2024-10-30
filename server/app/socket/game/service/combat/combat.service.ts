import { Player } from '@common/game';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ServerCombatService {
    isAttackSuccess(attackPlayer: Player, opponent: Player, attackDice: number, defenseDice: number): boolean {
        const attackTotal = attackPlayer.specs.attack + attackDice;
        const defendTotal = opponent.specs.defense + defenseDice;
        return attackTotal - defendTotal > 0;
    }
}
