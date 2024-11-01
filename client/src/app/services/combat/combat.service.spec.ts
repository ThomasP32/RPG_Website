// import { Avatar, Bonus, Player } from '@common/game';
// import { afterEach } from 'node:test';
// import { CombatService } from './combat.service';

// describe('CombatService', () => {
//     let service: CombatService;
//     let player1: Player;
//     let player2: Player;

//     beforeEach(() => {
//         const mockMath = Object.create(global.Math);
//         mockMath.random = () => 0.5;
//         global.Math = mockMath;
//         service = new CombatService();
//         player1 = {
//             socketId: 'player1-socket-id',
//             name: 'Player 1',
//             avatar: Avatar.Avatar1,
//             isActive: true,
//             specs: {
//                 life: 100,
//                 speed: 5,
//                 attack: 8,
//                 defense: 6,
//                 attackBonus: { diceType: Bonus.D6, currentValue: 0 },
//                 defenseBonus: { diceType: Bonus.D4, currentValue: 0 },
//                 movePoints: 5,
//                 actions: 2,
//                 nVictories: 0,
//                 nDefeats: 0,
//                 nCombats: 0,
//                 nEvasions: 0,
//                 nLifeTaken: 0,
//                 nLifeLost: 0,
//             },
//             inventory: [],
//             position: { x: 0, y: 0 },
//             turn: 0,
//             visitedTiles: [],
//         };
//         player2 = {
//             socketId: 'player2-socket-id',
//             name: 'Player 2',
//             avatar: Avatar.Avatar2,
//             isActive: true,
//             specs: {
//                 life: 80,
//                 speed: 6,
//                 attack: 7,
//                 defense: 7,
//                 attackBonus: { diceType: Bonus.D4, currentValue: 0 },
//                 defenseBonus: { diceType: Bonus.D6, currentValue: 0 },
//                 movePoints: 4,
//                 actions: 2,
//                 nVictories: 0,
//                 nDefeats: 0,
//                 nCombats: 0,
//                 nEvasions: 0,
//                 nLifeTaken: 0,
//                 nLifeLost: 0,
//             },
//             inventory: [],
//             position: { x: 5, y: 5 },
//             turn: 0,
//             visitedTiles: [],
//         };
//     });
//     afterEach(() => {
//         global.Math = Object.getPrototypeOf(global.Math);
//     });

//     it('should roll dice and assign bonuses correctly', () => {
//         service.rollDice(player1, player2);
//         const expectedPlayer1AttackBonus = Math.floor(0.5 * player1.specs.attackBonus.diceType) + 1;
//         const expectedPlayer1DefenseBonus = Math.floor(0.5 * player1.specs.defenseBonus.diceType) + 1;
//         const expectedPlayer2AttackBonus = Math.floor(0.5 * player2.specs.attackBonus.diceType) + 1;
//         const expectedPlayer2DefenseBonus = Math.floor(0.5 * player2.specs.defenseBonus.diceType) + 1;

//         expect(player1.specs.attackBonus.currentValue).toBe(expectedPlayer1AttackBonus);
//         expect(player1.specs.defenseBonus.currentValue).toBe(expectedPlayer1DefenseBonus);
//         expect(player2.specs.attackBonus.currentValue).toBe(expectedPlayer2AttackBonus);
//         expect(player2.specs.defenseBonus.currentValue).toBe(expectedPlayer2DefenseBonus);
//     });
// });
