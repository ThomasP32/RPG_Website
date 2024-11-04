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
            challengerLife: challenger.specs.life,
            opponentLife: opponent.specs.life,
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

    rollDice(
        attackPlayer: Player,
        opponent: Player,
    ): {
        attackingPlayerAttackDice: number;
        attackingPlayerDefenseDice: number;
        opponentAttackDice: number;
        opponentDefenseDice: number;
        attackDice: number;
        defenseDice: number;
    } {
        const attackingPlayerAttackDice = Math.floor(Math.random() * attackPlayer.specs.attackBonus) + 1;
        const attackingPlayerDefenseDice = Math.floor(Math.random() * attackPlayer.specs.defenseBonus) + 1;
        const opponentAttackDice = Math.floor(Math.random() * opponent.specs.attackBonus) + 1;
        const opponentDefenseDice = Math.floor(Math.random() * opponent.specs.defenseBonus) + 1;
        const attackDice = attackPlayer.specs.attack + attackingPlayerAttackDice;
        const defenseDice = opponent.specs.defense + opponentDefenseDice;

        return {
            attackingPlayerAttackDice,
            attackingPlayerDefenseDice,
            opponentAttackDice,
            opponentDefenseDice,
            attackDice,
            defenseDice,
        };
    }

    combatWinStatsUpdate(winner: Player, loser: Player) {
        winner.specs.nVictories += 1;
        winner.specs.nCombats += 1;
        loser.specs.nDefeats += 1;
        loser.specs.nCombats += 1;
    }

    updatePlayersInGame(game) {
        const combat = this.getCombatByGameId(game.id);
        game.players.forEach((player, index) => {
            if (player.socketId === combat.challenger.socketId) {
                game.players[index] = combat.challenger;
            } else if (player.socketId === combat.opponent.socketId) {
                game.players[index] = combat.opponent;
            }
        });
    }
}
