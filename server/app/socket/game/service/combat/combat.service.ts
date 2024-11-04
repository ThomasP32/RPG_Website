import { Combat } from '@common/combat';
import { Player } from '@common/game';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ServerCombatService {
    private combatRooms: Record<string, Combat> = {};

    createCombat(gameId: string, challenger: Player, opponent: Player): Combat {
        let currentTurnSocketId: string = challenger.socketId;
        if (challenger.specs.speed < opponent.specs.speed) {
            currentTurnSocketId = opponent.socketId;
        }
        const combatRoomId = gameId + '-combat';
        const combat: Combat = {
            challenger: challenger,
            opponent: opponent,
            currentTurnSocketId: currentTurnSocketId,
            id: combatRoomId,
        };
        this.combatRooms[gameId] = combat;
        return combat;
    }

    getCombatByGameId(gameId: string): Combat {
        const combat = this.combatRooms[gameId];
        if (!combat) {
            console.log(`Game with ID ${gameId} not found.`);
            return null;
        }
        return combat;
    }

    doesCombatExist(gameId: string): boolean {
        return gameId in this.combatRooms;
    }


    isAttackSuccess(attackPlayer: Player, opponent: Player, attackDice: number, defenseDice: number): boolean {
        const attackTotal = attackPlayer.specs.attack + attackDice;
        const defendTotal = opponent.specs.defense + defenseDice;
        return attackTotal - defendTotal > 0;
    }
}
