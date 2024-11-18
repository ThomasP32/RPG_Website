import { Bonus, Game, Player, Specs } from '@common/game';
import { Mode } from '@common/map.types';
import { GameCreationService } from '../game-creation/game-creation.service';
import { ServerCombatService } from './combat.service';

describe('ServerCombatService', () => {
    let service: ServerCombatService;
    let gameCreationService: GameCreationService;

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

        service = new ServerCombatService(gameCreationService);
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
    } as Player;

    const game: Game = {
        id: 'game1',
        players: [challenger, opponent],
        mapSize: { x: 5, y: 5 },
    } as Game;

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
});
