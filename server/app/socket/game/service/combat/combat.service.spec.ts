import { ProfileType } from '@common/constants';
import { Bonus, Game, Player, Specs } from '@common/game';
import { Coordinate, ItemCategory, Mode, TileCategory } from '@common/map.types';
import { Server } from 'socket.io';
import { GameCreationService } from '../game-creation/game-creation.service';
import { ItemsManagerService } from '../items-manager/items-manager.service';
import { CombatService } from './combat.service';

describe('ServerCombatService', () => {
    let service: CombatService;
    let gameCreationService: GameCreationService;
    let itemsManagerService: ItemsManagerService;

    beforeEach(() => {
        challenger.specs.nVictories = 0;
        challenger.specs.nDefeats = 0;
        challenger.specs.nCombats = 0;
        opponent.specs.nVictories = 0;
        opponent.specs.nDefeats = 0;
        opponent.specs.nCombats = 0;

        gameCreationService = {
            getGameById: jest.fn().mockImplementation((gameId: string) => {
                if (gameId === game.id) return game;
                return undefined;
            }),
        } as unknown as GameCreationService;

        itemsManagerService = {
            dropInventory: jest.fn(),
            pickUpItem: jest.fn(),
            dropItem: jest.fn(),
            activateItem: jest.fn(),
        } as unknown as ItemsManagerService;

        service = new CombatService(gameCreationService, itemsManagerService);
    });

    const challenger: Player = {
        socketId: 'challenger1',
        specs: {
            life: 3,
            speed: 10,
            attack: 5,
            defense: 3,
            attackBonus: Bonus.D6,
            defenseBonus: Bonus.D4,
            evasions: 2,
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
        } as Specs,
        position: { x: 0, y: 0 },
        initialPosition: { x: 0, y: 0 },
        profile: ProfileType.NORMAL,
    } as Player;

    const opponent: Player = {
        socketId: 'opponent1',
        specs: {
            life: 3,
            speed: 5,
            attack: 4,
            defense: 2,
            attackBonus: Bonus.D4,
            defenseBonus: Bonus.D6,
            evasions: 2,
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
        } as Specs,
        position: { x: 1, y: 1 },
        initialPosition: { x: 1, y: 1 },
        profile: ProfileType.NORMAL,
    } as Player;

    const game: Game = {
        id: 'test-game-id',
        hostSocketId: 'test-socket',
        hasStarted: true,
        currentTurn: 0,
        mapSize: { x: 10, y: 10 },
        tiles: [
            { coordinate: { x: 2, y: 2 }, category: TileCategory.Water },
            { coordinate: { x: 3, y: 3 }, category: TileCategory.Ice },
            { coordinate: { x: 4, y: 4 }, category: TileCategory.Wall },
        ],
        doorTiles: [
            { coordinate: { x: 1, y: 2 }, isOpened: false },
            { coordinate: { x: 2, y: 1 }, isOpened: true },
        ],
        startTiles: [{ coordinate: { x: 0, y: 0 } }],
        items: [{ coordinate: { x: 0, y: 1 }, category: ItemCategory.Armor }],
        players: [opponent, challenger],
        mode: Mode.Classic,
        nTurns: 0,
        debug: false,
        nDoorsManipulated: [],
        duration: 0,
        isLocked: true,
        name: 'game',
        description: 'game description',
        imagePreview: 'image-preview',
    };

    it('should create a combat with correct initial player turn based on speed', () => {
        const combat = service.createCombat(game.id, challenger, opponent);
        expect(combat.currentTurnSocketId).toBe(challenger.socketId);
        expect(service.getCombatByGameId(game.id)).toEqual(combat);
    });

    it('should update turn correctly', () => {
        service.createCombat(game.id, challenger, opponent);
        service.updateTurn(game.id);
        const combat = service.getCombatByGameId(game.id);
        expect(combat.currentTurnSocketId).toBe(opponent.socketId);

        service.updateTurn(game.id);
        expect(combat.currentTurnSocketId).toBe(challenger.socketId);
    });

    it('should correctly determine attack success based on dice rolls and specs', () => {
        const rollResult = { attackDice: 5, defenseDice: 2 };
        const success = service.isAttackSuccess(challenger, opponent, rollResult);
        expect(success).toBe(true);
    });

    it('should update combat stats for the winner', () => {
        service.createCombat(game.id, challenger, opponent);
        service.combatWinStatsUpdate(challenger, game.id);
        const combat = service.getCombatByGameId(game.id);
        expect(combat.challenger.specs.nVictories).toBe(1);
        expect(combat.opponent.specs.nDefeats).toBe(1);
    });

    it('should move player back to initial position if unoccupied', () => {
        service.createCombat(game.id, challenger, opponent);
        service.sendBackToInitPos(challenger, game);
        expect(challenger.position).toEqual(challenger.initialPosition);
    });

    it('should move player to closest available position if initial position is occupied', () => {
        game.players.push({
            ...challenger,
            socketId: 'otherPlayer',
            position: { x: 0, y: 0 },
            initialPosition: { x: 0, y: 0 },
        });
        service.createCombat(game.id, challenger, opponent);
        service.sendBackToInitPos(challenger, game);
        expect(challenger.position).not.toEqual(challenger.initialPosition);
    });

    it('should find the closest available position for a player', () => {
        const closestPosition = service.findClosestAvailablePosition({ x: 0, y: 0 }, game);
        expect(closestPosition).toEqual({ x: 0, y: 1 });
    });

    it('should update players in game after combat', () => {
        service.createCombat(game.id, challenger, opponent);
        service.updatePlayersInGame(game);
        const combat = service.getCombatByGameId(game.id);
        expect(game.players[0].specs.life).toBe(combat.challengerLife);
        expect(game.players[1].specs.life).toBe(combat.opponentLife);
        expect(game.players[0].specs.evasions).toBe(2);
        expect(game.players[1].specs.evasions).toBe(2);
    });

    it('should update challenger stats on win and opponent stats on loss', () => {
        service.createCombat(game.id, challenger, opponent);

        service.combatWinStatsUpdate(challenger, game.id);

        const combatChallenger = service.getCombatByGameId(game.id).challenger;
        const combatOpponent = service.getCombatByGameId(game.id).opponent;
        expect(combatChallenger.specs.nVictories).toBe(1);
        expect(combatOpponent.specs.nDefeats).toBe(1);
    });

    it('should update opponent stats on win and challenger stats on loss', () => {
        service.createCombat(game.id, challenger, opponent);

        service.combatWinStatsUpdate(opponent, game.id);

        const combatChallenger = service.getCombatByGameId(game.id).challenger;
        const combatOpponent = service.getCombatByGameId(game.id).opponent;
        expect(combatOpponent.specs.nVictories).toBe(1);
        expect(combatChallenger.specs.nDefeats).toBe(1);
    });

    it('should return attack and defense dice rolls within the correct range', () => {
        const minAttackRoll = challenger.specs.attack + 1;
        const maxAttackRoll = challenger.specs.attack + challenger.specs.attackBonus;
        const minDefenseRoll = opponent.specs.defense + 1;
        const maxDefenseRoll = opponent.specs.defense + opponent.specs.defenseBonus;

        const rollResult = service.rollDice(challenger, opponent);

        expect(rollResult.attackDice).toBeGreaterThanOrEqual(minAttackRoll);
        expect(rollResult.attackDice).toBeLessThanOrEqual(maxAttackRoll);
        expect(rollResult.defenseDice).toBeGreaterThanOrEqual(minDefenseRoll);
        expect(rollResult.defenseDice).toBeLessThanOrEqual(maxDefenseRoll);
    });

    it("should calculate attackDice based on player's attack and attackBonus", () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.5);

        const rollResult = service.rollDice(challenger, opponent);

        const expectedAttackDice = challenger.specs.attack + Math.floor(0.5 * challenger.specs.attackBonus) + 1;
        const expectedDefenseDice = opponent.specs.defense + Math.floor(0.5 * opponent.specs.defenseBonus) + 1;

        expect(rollResult.attackDice).toBe(expectedAttackDice);
        expect(rollResult.defenseDice).toBe(expectedDefenseDice);

        jest.spyOn(Math, 'random').mockRestore();
    });

    it('should return null and log message if combat does not exist for a given gameId', () => {
        const combat = service.getCombatByGameId('nonexistent-game-id');
        expect(combat).toBeUndefined();
    });

    it('should return true if player reaches the required victories in Classic mode', () => {
        const mockGame = { id: 'game1', mode: Mode.Classic } as Game;
        gameCreationService.getGameById = jest.fn().mockReturnValue(mockGame);
        challenger.specs.nVictories = 3;

        const result = service.checkForGameWinner(mockGame.id, challenger);

        expect(result).toBe(true);
    });

    it('should return false if player does not reach the required victories in Classic mode', () => {
        const mockGame = { id: 'game1', mode: Mode.Classic } as Game;
        gameCreationService.getGameById = jest.fn().mockReturnValue(mockGame);
        challenger.specs.nVictories = 2;

        const result = service.checkForGameWinner(mockGame.id, challenger);

        expect(result).toBe(false);
    });

    it('should return false if the game mode is not Classic', () => {
        const mockGame = { id: 'game1', mode: Mode.Ctf } as Game;
        gameCreationService.getGameById = jest.fn().mockReturnValue(mockGame);
        challenger.specs.nVictories = 3;

        const result = service.checkForGameWinner(mockGame.id, challenger);

        expect(result).toBe(false);
    });

    describe('handleAttackSuccess', () => {
        const combatId = 'combat-id';
        const attackingPlayer: Player = {
            socketId: 'attacker-id',
            specs: {
                life: 3,
                speed: 5,
                attack: 4,
                defense: 3,
                attackBonus: Bonus.D6,
                defenseBonus: Bonus.D4,
                evasions: 1,
                nLifeLost: 0,
                nLifeTaken: 0,
                nVictories: 0,
                nDefeats: 0,
                nCombats: 0,
            } as Specs,
            position: { x: 0, y: 0 },
            initialPosition: { x: 0, y: 0 },
            inventory: [],
        } as Player;

        const defendingPlayer: Player = {
            socketId: 'defender-id',
            specs: {
                life: 3,
                speed: 4,
                attack: 3,
                defense: 2,
                attackBonus: Bonus.D4,
                defenseBonus: Bonus.D6,
                evasions: 2,
                nLifeLost: 0,
                nLifeTaken: 0,
                nVictories: 0,
                nDefeats: 0,
                nCombats: 0,
            } as Specs,
            position: { x: 1, y: 1 },
            initialPosition: { x: 1, y: 1 },
            inventory: [],
        } as Player;

        let mockServer: jest.Mocked<Server>;

        beforeEach(() => {
            mockServer = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn(),
            } as unknown as jest.Mocked<Server>;

            service.server = mockServer;
        });

        it('should decrement the defending player’s life', () => {
            service.handleAttackSuccess(attackingPlayer, defendingPlayer, combatId);

            expect(defendingPlayer.specs.life).toBe(2);
            expect(defendingPlayer.specs.nLifeLost).toBe(1);
            expect(attackingPlayer.specs.nLifeTaken).toBe(1);
        });

        it('should activate Flask item if defending player has it and life is 1', () => {
            defendingPlayer.inventory.push(ItemCategory.Flask);
            defendingPlayer.specs.life = 3;

            const activateItemSpy = jest.spyOn(itemsManagerService, 'activateItem');

            service.handleAttackSuccess(attackingPlayer, defendingPlayer, combatId);

            expect(activateItemSpy).toHaveBeenCalledWith(ItemCategory.Flask, defendingPlayer);
        });

        it('should not activate Flask item if defending player does not have it', () => {
            defendingPlayer.specs.life = 2;
            defendingPlayer.inventory = [];

            const activateItemSpy = jest.spyOn(itemsManagerService, 'activateItem');

            service.handleAttackSuccess(attackingPlayer, defendingPlayer, combatId);

            expect(activateItemSpy).not.toHaveBeenCalled();
        });

        it('should emit attackSuccess event with defending player', () => {
            service.handleAttackSuccess(attackingPlayer, defendingPlayer, combatId);

            expect(mockServer.to).toHaveBeenCalledWith(combatId);
            expect(mockServer.emit).toHaveBeenCalledWith('attackSuccess', defendingPlayer);
        });
    });
    describe('setServer', () => {
        let mockServer: jest.Mocked<Server>;

        beforeEach(() => {
            mockServer = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn(),
            } as unknown as jest.Mocked<Server>;
        });

        it('should set the server instance', () => {
            service.setServer(mockServer);

            expect(service.server).toBe(mockServer);
        });

        it('should allow the server to emit events after being set', () => {
            service.setServer(mockServer);

            service.server.to('combat-room').emit('testEvent', { key: 'value' });

            expect(mockServer.to).toHaveBeenCalledWith('combat-room');
            expect(mockServer.to('combat-room').emit).toHaveBeenCalledWith('testEvent', { key: 'value' });
        });
    });

    it('should delete the combat for a given gameId', () => {
        service.createCombat(game.id, challenger, opponent);
        expect(service.getCombatByGameId(game.id)).toBeDefined();

        service.deleteCombat(game.id);
        expect(service.getCombatByGameId(game.id)).toBeUndefined();
    });

    it('should return false if the position is occupied by a wall tile', () => {
        const pos: Coordinate = { x: 4, y: 4 };
        const result = service.isReachableTile(pos, game);
        expect(result).toBe(false);
    });

    it('should return false if the position is occupied by a closed door', () => {
        const pos: Coordinate = { x: 1, y: 2 };
        const result = service.isReachableTile(pos, game);
        expect(result).toBe(false);
    });

    it('should return true if the position is occupied by an opened door', () => {
        const pos: Coordinate = { x: 2, y: 1 };
        const result = service.isReachableTile(pos, game);
        expect(result).toBe(true);
    });

    it('should return false if the position is occupied by an active player', () => {
        const activePlayer = { ...challenger, isActive: true, position: { x: 0, y: 0 } };
        game.players.push(activePlayer);
        const pos: Coordinate = { x: 0, y: 0 };
        const result = service.isReachableTile(pos, game);
        expect(result).toBe(false);
    });

    it('should return false if the position is occupied by an item', () => {
        const pos: Coordinate = { x: 0, y: 1 };
        const result = service.isReachableTile(pos, game);
        expect(result).toBe(false);
    });

    it('should return true if the position is not occupied by any obstacle', () => {
        const pos: Coordinate = { x: 5, y: 5 };
        const result = service.isReachableTile(pos, game);
        expect(result).toBe(true);
    });
});
