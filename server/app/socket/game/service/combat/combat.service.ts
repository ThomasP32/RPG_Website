import { Coordinate } from '@app/http/model/schemas/map/coordinate.schema';
import { Combat } from '@common/combat';
import { DIRECTIONS } from '@common/directions';
import { Game, Player } from '@common/game';
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
        if (this.doesCombatExist(gameId)) {
            return this.combatRooms[gameId];
        } else {
            console.log(`Combat in game with ID ${gameId} not found.`);
        }
    }

    doesCombatExist(gameId: string): boolean {
        return gameId in this.combatRooms;
    }

    isAttackSuccess(attackPlayer: Player, opponent: Player, rollResult: { attackDice: number; defenseDice: number }): boolean {
        const attackTotal = attackPlayer.specs.attack + rollResult.attackDice;
        const defendTotal = opponent.specs.defense + rollResult.defenseDice;
        return attackTotal - defendTotal > 0;
    }

    updateTurn(gameId: string): void {
        console.log('le tour est mis a jour');
        const combat = this.getCombatByGameId(gameId);
        const currentTurnSocket = combat.currentTurnSocketId;
        if (currentTurnSocket === combat.challenger.socketId) {
            combat.currentTurnSocketId = combat.opponent.socketId;
        } else {
            combat.currentTurnSocketId = combat.challenger.socketId;
        }
    }

    rollDice(attackPlayer: Player, opponent: Player): { attackDice: number; defenseDice: number } {
        const attackingPlayerAttackDice = Math.floor(Math.random() * attackPlayer.specs.attackBonus) + 1;
        const opponentDefenseDice = Math.floor(Math.random() * opponent.specs.defenseBonus) + 1;
        const attackDice = attackPlayer.specs.attack + attackingPlayerAttackDice;
        const defenseDice = opponent.specs.defense + opponentDefenseDice;

        return {
            attackDice,
            defenseDice,
        };
    }

    combatWinStatsUpdate(winner: Player, gameId: string) {
        if (winner.socketId === this.combatRooms[gameId].challenger.socketId) {
            this.combatRooms[gameId].challenger.specs.nVictories++;
            this.combatRooms[gameId].challenger.specs.nCombats++;
            this.combatRooms[gameId].opponent.specs.nDefeats++;
            this.combatRooms[gameId].opponent.specs.nCombats++;
        } else {
            this.combatRooms[gameId].opponent.specs.nVictories++;
            this.combatRooms[gameId].opponent.specs.nCombats++;
            this.combatRooms[gameId].challenger.specs.nDefeats++;
            this.combatRooms[gameId].challenger.specs.nCombats++;
        }
    }

    sendBackToInitPos(player: Player, game: Game) {
        let currentPlayer = this.combatRooms[game.id].challenger;

        if (player.socketId === this.combatRooms[game.id].opponent.socketId) {
            currentPlayer = this.combatRooms[game.id].opponent;
        }

        const isPositionOccupied = game.players.some(
            (otherPlayer) =>
                otherPlayer.position.x === currentPlayer.initialPosition.x &&
                otherPlayer.position.y === currentPlayer.initialPosition.y &&
                otherPlayer.socketId !== player.socketId,
        );

        if (!isPositionOccupied) {
            currentPlayer.position = currentPlayer.initialPosition;
        } else {
            const closestPosition = this.findClosestAvailablePosition(currentPlayer.initialPosition, game);
            if (closestPosition) {
                currentPlayer.position = closestPosition;
            }
        }
    }

    findClosestAvailablePosition(initialPosition: { x: number; y: number }, game: Game): Coordinate {
        for (let distance = 1; distance <= game.mapSize.x; distance++) {
            for (const direction of DIRECTIONS) {
                const newPosition = {
                    x: initialPosition.x + direction.x * distance,
                    y: initialPosition.y + direction.y * distance,
                };

                const isOccupied = game.players.some(
                    (otherPlayer) => otherPlayer.position.x === newPosition.x && otherPlayer.position.y === newPosition.y,
                );

                if (!isOccupied) {
                    return newPosition;
                }
            }
        }
    }

    updatePlayersInGame(game: Game) {
        const combat = this.getCombatByGameId(game.id);
        game.players.forEach((player, index) => {
            if (player.socketId === combat.challenger.socketId) {
                combat.challenger.specs.life = combat.challengerLife;
                combat.challenger.specs.evasions = 2;
                game.players[index] = combat.challenger;
            } else if (player.socketId === combat.opponent.socketId) {
                combat.opponent.specs.life = combat.opponentLife;
                combat.opponent.specs.evasions = 2;
                game.players[index] = combat.opponent;
            }
        });
    }
}
