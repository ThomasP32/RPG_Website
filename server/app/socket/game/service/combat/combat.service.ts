import { Player } from '@common/game';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ServerCombatService {
    isAttackSuccess(attackPlayer: Player, player2: Player, player1Dice: number, player2Dice: number): boolean {
        const attackPlayerTotal = player1Dice + attackPlayer.specs.attack;
        const player2Total = player2Dice + player2.specs.defense;
        return attackPlayerTotal - player2Total > 0;
    }
}
