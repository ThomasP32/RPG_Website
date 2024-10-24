import { Player } from '@common/game';
import { ServerCombatService } from './combat.service';

describe('ServerCombatService', () => {
    let service: ServerCombatService;

    beforeEach(() => {
        service = new ServerCombatService();
    });

    it('should return true if the attack is successful', () => {
        const attackPlayer: Player = {
            socketId: 'player1',
            name: 'Attacker',
            avatar: 4,
            isActive: true,
            specs: {
                life: 100,
                speed: 7,
                attack: 10,
                defense: 5,
                attackBonus: 6,
                defenseBonus: 4,
                movePoints: 5,
                actions: 2,
                nVictories: 3,
                nDefeats: 1,
                nCombats: 5,
                nEvasions: 1,
                nLifeTaken: 20,
                nLifeLost: 10,
            },
            inventory: [],
            position: { x: 0, y: 0 },
            turn: 1,
            visitedTiles: [],
        };
        const player2: Player = {
            socketId: 'player2',
            name: 'Defender',
            avatar: 3,
            isActive: true,
            specs: {
                life: 100,
                speed: 6,
                attack: 8,
                defense: 8,
                attackBonus: 4,
                defenseBonus: 6,
                movePoints: 5,
                actions: 2,
                nVictories: 4,
                nDefeats: 2,
                nCombats: 6,
                nEvasions: 2,
                nLifeTaken: 15,
                nLifeLost: 5,
            },
            inventory: [],
            position: { x: 1, y: 1 },
            turn: 2,
            visitedTiles: [],
        };
        const player1Dice = 5;
        const player2Dice = 3;

        const result = service.isAttackSuccess(attackPlayer, player2, player1Dice, player2Dice);

        expect(result).toBe(true);
    });

    it('should return false if the attack is unsuccessful', () => {
        const attackPlayer: Player = {
            socketId: 'player1',
            name: 'Attacker',
            avatar: 2,
            isActive: true,
            specs: {
                life: 100,
                speed: 7,
                attack: 6,
                defense: 5,
                attackBonus: 6,
                defenseBonus: 4,
                movePoints: 5,
                actions: 2,
                nVictories: 3,
                nDefeats: 1,
                nCombats: 5,
                nEvasions: 1,
                nLifeTaken: 20,
                nLifeLost: 10,
            },
            inventory: [],
            position: { x: 0, y: 0 },
            turn: 1,
            visitedTiles: [],
        };
        const player2: Player = {
            socketId: 'player2',
            name: 'Defender',
            avatar: 1,
            isActive: true,
            specs: {
                life: 100,
                speed: 6,
                attack: 8,
                defense: 10,
                attackBonus: 4,
                defenseBonus: 6,
                movePoints: 5,
                actions: 2,
                nVictories: 4,
                nDefeats: 2,
                nCombats: 6,
                nEvasions: 2,
                nLifeTaken: 15,
                nLifeLost: 5,
            },
            inventory: [],
            position: { x: 1, y: 1 },
            turn: 2,
            visitedTiles: [],
        };
        const player1Dice = 2;
        const player2Dice = 4;

        const result = service.isAttackSuccess(attackPlayer, player2, player1Dice, player2Dice);

        expect(result).toBe(false);
    });
});
