import { Coordinate } from '@app/http/model/schemas/map/coordinate.schema';
import { Combat, RollResult } from '@common/combat';
import { DIRECTIONS } from '@common/directions';
import { Game, Player } from '@common/game';
import { ItemCategory, Mode } from '@common/map.types';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { N_WIN_VICTORIES } from '../../../../../constants/constants';
import { GameCreationService } from '../game-creation/game-creation.service';
import { ItemsManagerService } from '../items-manager/items-manager.service';

@Injectable()
export class CombatService {
    private combatRooms: Record<string, Combat> = {};
    server: Server;

    constructor(
        private readonly gameCreationService: GameCreationService,
        private readonly itemManagerService: ItemsManagerService,
    ) {
        this.gameCreationService = gameCreationService;
        this.itemManagerService = itemManagerService;
    }

    setServer(server: Server) {
        this.server = server;
    }

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
            challengerAttack: challenger.specs.attack,
            opponentAttack: opponent.specs.attack,
            challengerDefense: challenger.specs.defense,
            opponentDefense: opponent.specs.defense,
            id: combatRoomId,
        };
        this.combatRooms[gameId] = combat;
        return combat;
    }

    getCombatByGameId(gameId: string): Combat {
        if (this.doesCombatExist(gameId)) {
            return this.combatRooms[gameId];
        }
    }

    doesCombatExist(gameId: string): boolean {
        return gameId in this.combatRooms;
    }

    deleteCombat(gameId: string) {
        delete this.combatRooms[gameId];
    }

    isAttackSuccess(attackPlayer: Player, opponent: Player, rollResult: { attackDice: number; defenseDice: number }): boolean {
        const attackTotal = attackPlayer.specs.attack + rollResult.attackDice;
        const defendTotal = opponent.specs.defense + rollResult.defenseDice;
        return attackTotal - defendTotal > 0;
    }

    handleAttackSuccess(attackingPlayer: Player, defendingPlayer: Player, combatId: string) {
        defendingPlayer.specs.life--;
        defendingPlayer.specs.nLifeLost++;
        attackingPlayer.specs.nLifeTaken++;

        if (defendingPlayer.inventory.includes(ItemCategory.Flask) && defendingPlayer.specs.life === 2) {
            this.itemManagerService.activateItem(ItemCategory.Flask, defendingPlayer);
        }
        this.server.to(combatId).emit('attackSuccess', defendingPlayer);
    }

    updateTurn(gameId: string): void {
        const combat = this.getCombatByGameId(gameId);
        const currentTurnSocket = combat.currentTurnSocketId;
        combat.currentTurnSocketId = currentTurnSocket === combat.challenger.socketId ? combat.opponent.socketId : combat.challenger.socketId;
    }

    rollDice(attackPlayer: Player, opponent: Player): RollResult {
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
            this.combatRooms[gameId].opponent.specs.nDefeats++;
        } else {
            this.combatRooms[gameId].opponent.specs.nVictories++;
            this.combatRooms[gameId].challenger.specs.nDefeats++;
        }
    }

    sendBackToInitPos(player: Player, game: Game) {
        const combat = this.getCombatByGameId(game.id);
        const currentPlayer = player.socketId === combat.challenger.socketId ? combat.challenger : combat.opponent;

        const isPositionOccupied = game.players.some(
            (otherPlayer) =>
                otherPlayer.position.x === currentPlayer.initialPosition.x &&
                otherPlayer.position.y === currentPlayer.initialPosition.y &&
                otherPlayer.socketId !== currentPlayer.socketId,
        );
        if (!isPositionOccupied) {
            currentPlayer.position = currentPlayer.initialPosition;
        } else {
            const closestPosition = this.findClosestAvailablePosition(currentPlayer.initialPosition, game);
            currentPlayer.position = closestPosition;
        }
        currentPlayer.inventory = [];
    }

    findClosestAvailablePosition(initialPosition: Coordinate, game: Game): Coordinate {
        for (let distance = 1; distance <= game.mapSize.x; distance++) {
            for (const direction of DIRECTIONS) {
                const newPosition = {
                    x: initialPosition.x + direction.x * distance,
                    y: initialPosition.y + direction.y * distance,
                };
                const isOccupied = game.players.some(
                    (otherPlayer) => otherPlayer.position.x === newPosition.x && otherPlayer.position.y === newPosition.y,
                );
                const isOutOfMap = newPosition.x < 0 || newPosition.y < 0 || newPosition.x >= game.mapSize.x || newPosition.y >= game.mapSize.y;

                if (!isOccupied && !isOutOfMap) {
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
                combat.challenger.specs.attack = combat.challengerAttack;
                combat.challenger.specs.evasions = 2;
                combat.challenger.specs.nCombats++;
                game.players[index] = combat.challenger;
            } else if (player.socketId === combat.opponent.socketId) {
                combat.opponent.specs.life = combat.opponentLife;
                combat.opponent.specs.attack = combat.opponentAttack;
                combat.opponent.specs.evasions = 2;
                combat.opponent.specs.nCombats++;
                game.players[index] = combat.opponent;
            }
        });
    }

    checkForGameWinner(gameId: string, player: Player): boolean {
        if (this.gameCreationService.getGameById(gameId).mode === Mode.Classic) {
            return player.specs.nVictories >= N_WIN_VICTORIES;
        }
        return false;
    }
}
