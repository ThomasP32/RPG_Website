import { Coordinate } from '@app/http/model/schemas/map/coordinate.schema';
import { Combat, RollResult } from '@common/combat';
import { DEFAULT_EVASIONS, DEFENDING_PLAYER_LIFE, ROLL_DICE_CONSTANT } from '@common/constants';
import { CORNER_DIRECTIONS, DIRECTIONS } from '@common/directions';
import { Game, Player } from '@common/game';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
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

        if (defendingPlayer.inventory.includes(ItemCategory.Flask) && defendingPlayer.specs.life === DEFENDING_PLAYER_LIFE) {
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
        const attackingPlayerAttackDice = Math.floor(Math.random() * attackPlayer.specs.attackBonus) + ROLL_DICE_CONSTANT;
        const opponentDefenseDice = Math.floor(Math.random() * opponent.specs.defenseBonus) + ROLL_DICE_CONSTANT;
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
            for (const direction of [...DIRECTIONS, ...CORNER_DIRECTIONS]) {
                const newPosition = {
                    x: initialPosition.x + direction.x * distance,
                    y: initialPosition.y + direction.y * distance,
                };

                const isOutOfMap = newPosition.x < 0 || newPosition.y < 0 || newPosition.x >= game.mapSize.x || newPosition.y >= game.mapSize.y;

                const isReachableTile = this.isReachableTile(newPosition, game);

                if (!isReachableTile && !isOutOfMap) {
                    return newPosition;
                }
            }
        }
    }

    isReachableTile(pos: Coordinate, game: Game): boolean {
        for (const tile of game.tiles) {
            if (tile.coordinate.x === pos.x && tile.coordinate.y === pos.y) {
                if (tile.category === TileCategory.Wall) return false;
            }
        }
        for (const door of game.doorTiles) {
            if (door.coordinate.x === pos.x && door.coordinate.y === pos.y && !door.isOpened) {
                return false;
            }
        }
        for (const player of game.players) {
            if (player.isActive && player.position.x === pos.x && player.position.y === pos.y) {
                return false;
            }
        }
        for (const item of game.items) {
            if (item.coordinate.x === pos.x && item.coordinate.y === pos.y) {
                return false;
            }
        }
        return true;
    }

    updatePlayersInGame(game: Game) {
        const combat = this.getCombatByGameId(game.id);
        game.players.forEach((player, index) => {
            if (player.socketId === combat.challenger.socketId) {
                combat.challenger.specs.life = combat.challengerLife;
                combat.challenger.specs.attack = combat.challengerAttack;
                combat.challenger.specs.evasions = DEFAULT_EVASIONS;
                combat.challenger.specs.nCombats++;
                game.players[index] = combat.challenger;
            } else if (player.socketId === combat.opponent.socketId) {
                combat.opponent.specs.life = combat.opponentLife;
                combat.opponent.specs.attack = combat.opponentAttack;
                combat.opponent.specs.evasions = DEFAULT_EVASIONS;
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
