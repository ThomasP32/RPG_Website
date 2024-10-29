import { Player } from '@common/game';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ServerCombatService {
    isAttackSuccess(attackPlayer: Player, opponent: Player): boolean {
        const attackTotal = attackPlayer.specs.attack + attackPlayer.specs.attackBonus.currentValue;
        const defendTotal = opponent.specs.defense + opponent.specs.defenseBonus.currentValue;
        return attackTotal - defendTotal > 0;
    }
}
