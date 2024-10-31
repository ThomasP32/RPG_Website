import { Player } from '@common/game';
import { ServerCombatService } from '../../service/combat/combat.service';

describe('CombatGateway', () => {
    let serverCombatService: ServerCombatService;

    beforeEach(async () => {
        // const module: TestingModule = await Test.createTestingModule({
        //     providers: [
        //         CombatGateway,
        //         {
        //             provide: GameCreationService,
        //             useValue: {
        //                 getGame: jest.fn(),
        //             },
        //         },
        //         {
        //             provide: ServerCombatService,
        //             useValue: {
        //                 isAttackSuccess: jest.fn(),
        //             },
        //         },
        //     ],
        // }).compile();

        serverCombatService = new ServerCombatService();
        // client = {
        //     emit: jest.fn(),
        //     to: jest.fn().mockReturnThis(),
        //     broadcast: {
        //         to: jest.fn().mockReturnThis(),
        //         emit: jest.fn(),
        //     },
        // } as unknown as Socket;
    });
    describe('attack', () => {
        it('should emit attackSuccess if the attack is successful', () => {
            const attackPlayer: Player = {
                socketId: 'attacker_socket_id',
                name: 'Attacker',
                avatar: 1,
                isActive: true,
                specs: {
                    life: 100,
                    speed: 10,
                    attack: 5,
                    defense: 3,
                    attackBonus: 6,
                    defenseBonus: 4,
                    movePoints: 5,
                    actions: 2,
                    nVictories: 0,
                    nDefeats: 0,
                    nCombats: 0,
                    nEvasions: 0,
                    nLifeTaken: 0,
                    nLifeLost: 0,
                },
                inventory: [],
                position: { x: 0, y: 0 },
                turn: 1,
                visitedTiles: [],
            };

            const defendPlayer: Player = {
                socketId: 'defender_socket_id',
                name: 'Defender',
                avatar: 1,
                isActive: true,
                specs: {
                    life: 80,
                    speed: 5,
                    attack: 4,
                    defense: 2,
                    attackBonus: 6,
                    defenseBonus: 4,
                    movePoints: 5,
                    actions: 2,
                    nVictories: 0,
                    nDefeats: 0,
                    nCombats: 0,
                    nEvasions: 0,
                    nLifeTaken: 0,
                    nLifeLost: 0,
                },
                inventory: [],
                position: { x: 1, y: 1 },
                turn: 1,
                visitedTiles: [],
            };

            const player1Dice = 5;
            const player2Dice = 2;

            const res = serverCombatService.isAttackSuccess(attackPlayer, defendPlayer, player1Dice, player2Dice);
            expect(res).toBe(true);
            // gateway.attack(client, {
            //     attackPlayer,
            //     defendPlayer,
            //     gameId: 'game1',
            //     player1Dice,
            //     player2Dice,
            // });
            // expect(client.emit).toHaveBeenCalledWith('attackSuccess', {
            //     playerAttacked: defendPlayer,
            //     message: `Attaque réussie de ${attackPlayer.name}`,
            // });
        });
    });
});
