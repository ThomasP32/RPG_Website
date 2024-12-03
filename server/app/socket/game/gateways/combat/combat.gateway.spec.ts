import { CombatService } from '@app/services/combat/combat.service';
import { Combat } from '@common/combat';
import { ProfileType } from '@common/constants';
import { CombatEvents } from '@common/events/combat.events';
import { GameCreationEvents } from '@common/events/game-creation.events';
import { ItemsEvents } from '@common/events/items.events';
import { Avatar, Bonus, Game, Player } from '@common/game';
import { ItemCategory } from '@common/map.types';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { CombatCountdownService } from '../../../../services/countdown/combat/combat-countdown.service';
import { GameCountdownService } from '../../../../services/countdown/game/game-countdown.service';
import { GameCreationService } from '../../../../services/game-creation/game-creation.service';
import { GameManagerService } from '../../../../services/game-manager/game-manager.service';
import { ItemsManagerService } from '../../../../services/items-manager/items-manager.service';
import { JournalService } from '../../../../services/journal/journal.service';
import { VirtualGameManagerService } from '../../../../services/virtual-game-manager/virtual-game-manager.service';
import { CombatGateway } from './combat.gateway';

describe('CombatGateway', () => {
    let gateway: CombatGateway;
    let serverCombatService: jest.Mocked<CombatService>;
    let combatCountdownService: jest.Mocked<CombatCountdownService>;
    let gameCountdownService: jest.Mocked<GameCountdownService>;
    let gameCreationService: jest.Mocked<GameCreationService>;
    let gameManagerService: jest.Mocked<GameManagerService>;
    let mockServer: jest.Mocked<Server>;
    let mockSocket: jest.Mocked<Socket>;
    let mockOpponentSocket: jest.Mocked<Socket>;
    let journalService: jest.Mocked<JournalService>;
    let virtualGameManager: jest.Mocked<VirtualGameManagerService>;

    const mockCombat: Combat = {
        id: 'game-id-combat',
        challenger: {
            socketId: 'socket-id',
            name: 'Player1',
            avatar: Avatar.Avatar1,
            isActive: true,
            specs: {
                life: 5,
                evasions: 1,
                speed: 10,
                attack: 5,
                defense: 3,
                attackBonus: Bonus.D4,
                defenseBonus: Bonus.D4,
                movePoints: 0,
                actions: 0,
                nVictories: 0,
                nDefeats: 0,
                nCombats: 0,
                nEvasions: 0,
                nLifeTaken: 0,
                nLifeLost: 0,
                nItemsUsed: 0,
            },
            inventory: [],
            position: undefined,
            initialPosition: undefined,
            turn: 0,
            visitedTiles: [],
            profile: ProfileType.NORMAL,
        },
        opponent: {
            socketId: 'opponent-id',
            name: 'Player2',
            avatar: Avatar.Avatar2,
            isActive: true,
            specs: {
                life: 5,
                evasions: 1,
                speed: 9,
                attack: 4,
                defense: 3,
                attackBonus: Bonus.D6,
                defenseBonus: Bonus.D6,
                movePoints: 0,
                actions: 0,
                nVictories: 0,
                nDefeats: 0,
                nCombats: 0,
                nEvasions: 0,
                nLifeTaken: 0,
                nLifeLost: 0,
                nItemsUsed: 0,
            },
            inventory: [],
            position: undefined,
            initialPosition: undefined,
            turn: 1,
            visitedTiles: [],
            profile: ProfileType.NORMAL,
        },
        challengerLife: 5,
        opponentLife: 5,
        challengerAttack: 4,
        opponentAttack: 4,
        challengerDefense: 3,
        opponentDefense: 3,
        currentTurnSocketId: 'socket-id',
    };

    beforeEach(async () => {
        jest.useFakeTimers();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CombatGateway,
                {
                    provide: CombatService,
                    useValue: {
                        createCombat: jest.fn().mockReturnValue(mockCombat),
                        getCombatByGameId: jest.fn().mockReturnValue(mockCombat),
                        rollDice: jest.fn().mockReturnValue({ attackDice: 5, defenseDice: 3 }),
                        isAttackSuccess: jest.fn().mockReturnValue(true),
                        combatWinStatsUpdate: jest.fn(),
                        sendBackToInitPos: jest.fn(),
                        updatePlayersInGame: jest.fn(),
                        updateTurn: jest.fn(),
                        deleteCombat: jest.fn(),
                        checkForGameWinner: jest.fn(),
                        handleAttackSuccess: jest.fn(),
                        setServer: jest.fn(),
                    },
                },
                {
                    provide: CombatCountdownService,
                    useValue: {
                        setServer: jest.fn(),
                        on: jest.fn(),
                        initCountdown: jest.fn(),
                        deleteCountdown: jest.fn(),
                        resetTimerSubscription: jest.fn(),
                        startTurnCounter: jest.fn(),
                    },
                },
                {
                    provide: GameCountdownService,
                    useValue: {
                        pauseCountdown: jest.fn(),
                        resumeCountdown: jest.fn(),
                        emit: jest.fn(),
                    },
                },
                {
                    provide: GameManagerService,
                    useValue: {
                        updatePlayerActions: jest.fn(),
                    },
                },
                {
                    provide: GameCreationService,
                    useValue: {
                        getGames: jest.fn(),
                        getGameById: jest.fn().mockReturnValue({ id: 'game-id' }),
                        getPlayer: jest.fn().mockReturnValue(mockCombat.challenger),
                        handlePlayerLeaving: jest.fn(),
                        isPlayerHost: jest.fn(),
                        deleteRoom: jest.fn(),
                    },
                },
                {
                    provide: JournalService,
                    useValue: {
                        initializeServer: jest.fn(),
                        logMessage: jest.fn(),
                    },
                },
                {
                    provide: GameManagerService,
                    useValue: {
                        updatePlayerActions: jest.fn(),
                    },
                },
                {
                    provide: VirtualGameManagerService,
                    useValue: {
                        executeVirtualPlayerBehavior: jest.fn(),
                        handleVirtualPlayerCombat: jest.fn(),
                    },
                },
                {
                    provide: ItemsManagerService,
                    useValue: {
                        activateItem: jest.fn(),
                        desactivateItem: jest.fn(),
                        dropInventory: jest.fn(),
                        checkForAmulet: jest.fn(),
                    },
                },
            ],
        }).compile();

        gateway = module.get<CombatGateway>(CombatGateway);
        serverCombatService = module.get(CombatService);
        combatCountdownService = module.get(CombatCountdownService);
        gameCountdownService = module.get(GameCountdownService);
        gameCreationService = module.get(GameCreationService);
        gameManagerService = module.get(GameManagerService);
        journalService = module.get(JournalService);
        virtualGameManager = module.get(VirtualGameManagerService);

        mockSocket = {
            id: 'socket-id',
            join: jest.fn().mockResolvedValue(undefined),
            leave: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<Socket>;

        mockOpponentSocket = {
            id: 'opponent-id',
            join: jest.fn().mockResolvedValue(undefined),
            leave: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<Socket>;

        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            in: jest.fn().mockReturnThis(),
            fetchSockets: jest.fn().mockResolvedValue([mockSocket, mockOpponentSocket]),
        } as unknown as jest.Mocked<Server>;

        gateway.server = mockServer;
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    describe('attackOnTimeOut', () => {
        it('should emit dice roll results and attack success', () => {
            gateway.attackOnTimeOut('game-id');

            expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
            expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith(CombatEvents.DiceRolled, {
                attackDice: 5,
                defenseDice: 3,
            });
            expect(journalService.logMessage).toHaveBeenCalledWith(
                mockCombat.id,
                `Dés roulés. Dé d'attaque: 5. Dé de défense: 3. Résultat = 5 - 3.`,
                [mockCombat.challenger.name, mockCombat.opponent.name],
            );
            expect(journalService.logMessage).toHaveBeenCalledWith(mockCombat.id, `Réussite de l'attaque sur ${mockCombat.opponent.name}.`, [
                mockCombat.opponent.name,
            ]);
        });

        it('should emit dice roll results and attack failure', () => {
            serverCombatService.rollDice.mockReturnValue({ attackDice: 3, defenseDice: 5 });
            serverCombatService.isAttackSuccess.mockReturnValue(false);
            gateway.attackOnTimeOut('game-id');

            expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
            expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith(CombatEvents.DiceRolled, {
                attackDice: 3,
                defenseDice: 5,
            });
            expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith(CombatEvents.AttackFailure, mockCombat.opponent);
            expect(journalService.logMessage).toHaveBeenCalledWith(
                mockCombat.id,
                `Dés roulés. Dé d'attaque: 3. Dé de défense: 5. Résultat = 3 - 5.`,
                [mockCombat.challenger.name, mockCombat.opponent.name],
            );
            expect(journalService.logMessage).toHaveBeenCalledWith(mockCombat.id, `Échec de l'attaque sur ${mockCombat.opponent.name}.`, [
                mockCombat.opponent.name,
            ]);
        });

        it('should emit dice roll and attack success', () => {
            gateway.attackOnTimeOut('game-id');

            expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
            expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith(CombatEvents.DiceRolled, {
                attackDice: 5,
                defenseDice: 3,
            });
        });
    });

    describe('handleCombatLost', () => {
        it('should update combat stats and emit combatFinishedNormally', () => {
            const mockGame = { id: 'game-id', currentTurn: 0 } as Game;
            const defendingPlayer = { name: 'Player2', socketId: 'opponent-id', specs: { life: 0 } } as Player;
            const attackingPlayer = { name: 'Player1', socketId: 'socket-id', specs: { life: 5 } } as Player;

            gameCreationService.getGameById.mockReturnValue(mockGame);

            gateway.handleCombatLost(defendingPlayer, attackingPlayer, 'game-id', 'combat-id');

            expect(gameCreationService.getGameById).toHaveBeenCalledWith('game-id');
            expect(serverCombatService.combatWinStatsUpdate).toHaveBeenCalledWith(attackingPlayer, 'game-id');
            expect(serverCombatService.sendBackToInitPos).toHaveBeenCalledWith(defendingPlayer, mockGame);
            expect(serverCombatService.updatePlayersInGame).toHaveBeenCalledWith(mockGame);
            expect(mockServer.to('combat-id').emit).toHaveBeenCalledWith(CombatEvents.CombatFinishedNormally, attackingPlayer);
            expect(journalService.logMessage).toHaveBeenCalledWith('game-id', `Fin de combat. ${attackingPlayer.name} est le gagnant.`, [
                attackingPlayer.name,
            ]);
            expect(combatCountdownService.deleteCountdown).toHaveBeenCalledWith('game-id');
        });

        it('should emit gameFinished if the attacker wins the game', () => {
            const mockGame = { id: 'game-id', currentTurn: 0 } as Game;
            const defendingPlayer = { name: 'Player2', socketId: 'opponent-id', specs: { life: 0 } } as Player;
            const attackingPlayer = { name: 'Player1', socketId: 'socket-id', specs: { life: 5 } } as Player;

            gameCreationService.getGameById.mockReturnValue(mockGame);
            serverCombatService.checkForGameWinner.mockReturnValue(true);

            gateway.handleCombatLost(defendingPlayer, attackingPlayer, 'game-id', 'game-id-combat');
            jest.runAllTimers();

            expect(mockServer.to('game-id').emit).toHaveBeenCalledWith(CombatEvents.GameFinishedPlayerWon, attackingPlayer);
        });

        it('should resume countdown if attacker’s turn matches current turn', () => {
            const mockGame = { id: 'game-id', currentTurn: 0 } as Game;
            const defendingPlayer = { name: 'Player2', socketId: 'opponent-id', specs: { life: 0 } } as Player;
            const attackingPlayer = { name: 'Player1', socketId: 'socket-id', specs: { life: 5 }, turn: 0 } as Player;

            gameCreationService.getGameById.mockReturnValue(mockGame);
            serverCombatService.checkForGameWinner.mockReturnValue(false);

            gateway.handleCombatLost(defendingPlayer, attackingPlayer, 'game-id', 'combat-id');
            jest.runAllTimers();

            expect(gameCountdownService.resumeCountdown).toHaveBeenCalledWith('game-id');
            expect(mockServer.to(attackingPlayer.socketId).emit).toHaveBeenCalledWith(CombatEvents.ResumeTurnAfterCombatWin);
            expect(serverCombatService.deleteCombat).toHaveBeenCalledWith(mockGame.id);
        });

        it('should emit timeout if attacker’s turn does not match current turn', () => {
            const mockGame = { id: 'game-id', currentTurn: 1 } as Game;
            const defendingPlayer = { name: 'Player2', socketId: 'opponent-id', specs: { life: 0 } } as Player;
            const attackingPlayer = { name: 'Player1', socketId: 'socket-id', specs: { life: 5 }, turn: 0 } as Player;

            gameCreationService.getGameById.mockReturnValue(mockGame);
            serverCombatService.checkForGameWinner.mockReturnValue(false);

            gateway.handleCombatLost(defendingPlayer, attackingPlayer, 'game-id', 'combat-id');
            jest.runAllTimers();

            expect(gameCountdownService.emit).toHaveBeenCalledWith('timeout', 'game-id');
            expect(serverCombatService.deleteCombat).toHaveBeenCalledWith(mockGame.id);
        });
    });

    describe('startEvasion', () => {
        it('should emit evasion success and resume game countdown', async () => {
            mockCombat.currentTurnSocketId = mockCombat.challenger.socketId;
            jest.spyOn(Math, 'random').mockReturnValue(0.3);
            gameCreationService.getGameById.mockReturnValue({ id: 'game-id' } as Game);

            await gateway.startEvasion(mockSocket, 'game-id');
            jest.runAllTimers();

            expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
            expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith(CombatEvents.EvasionSuccess, mockCombat.challenger);
            expect(combatCountdownService.deleteCountdown).toHaveBeenCalledWith('game-id');
            expect(gameCountdownService.resumeCountdown).toHaveBeenCalledWith('game-id');
            expect(journalService.logMessage).toHaveBeenCalledWith('game-id', `Fin de combat. ${mockCombat.challenger.name} s'est évadé.`, [
                mockCombat.challenger.name,
            ]);

            jest.spyOn(Math, 'random').mockRestore();
        });

        it('should emit evasion success of opponent and resume game countdown', async () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.3);
            gameCreationService.getGameById.mockReturnValue({ id: 'game-id' } as Game);
            mockCombat.currentTurnSocketId = mockOpponentSocket.id;
            await gateway.startEvasion(mockOpponentSocket, 'game-id');
            jest.runAllTimers();

            expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
            expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith(CombatEvents.EvasionSuccess, mockCombat.opponent);
            expect(combatCountdownService.deleteCountdown).toHaveBeenCalledWith('game-id');
            expect(gameCountdownService.resumeCountdown).toHaveBeenCalledWith('game-id');
            expect(journalService.logMessage).toHaveBeenCalledWith('game-id', `Fin de combat. ${mockCombat.opponent.name} s'est évadé.`, [
                mockCombat.opponent.name,
            ]);

            jest.spyOn(Math, 'random').mockRestore();
            mockCombat.currentTurnSocketId = mockSocket.id;
        });

        it('should not emit evasion if evasion points are zero', async () => {
            mockCombat.challenger.specs.evasions = 0;
            await gateway.startEvasion(mockSocket, 'game-id');

            expect(mockServer.to(mockCombat.id).emit).not.toHaveBeenCalledWith(CombatEvents.EvasionSuccess);
        });

        it('should emit evasionFailed and prepare for the next turn on evasion failure', async () => {
            mockCombat.challenger.specs.evasions = 1;
            jest.spyOn(Math, 'random').mockReturnValue(0.9);
            gameCreationService.getGameById.mockReturnValue({ id: 'game-id' } as Game);

            await gateway.startEvasion(mockSocket, 'game-id');
            jest.runAllTimers();

            expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
            expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith(CombatEvents.EvasionFailed, mockCombat.challenger);
            expect(journalService.logMessage).toHaveBeenCalledWith(
                'game-id-combat',
                `Tentative d'évasion par ${mockCombat.challenger.name}: non réussie.`,
                [mockCombat.challenger.name],
            );

            jest.spyOn(Math, 'random').mockRestore();
        });
    });

    describe('startCombat', () => {
        it('should emit combatStarted, initialize countdowns, and start combat turns', async () => {
            const mockGame = { id: 'game-id', currentTurn: 0, players: [mockCombat.challenger, mockCombat.opponent] } as Game;
            gameCreationService.getGameById.mockReturnValue(mockGame);
            gameCreationService.getPlayer.mockReturnValue(mockCombat.challenger);
            mockServer.in.mockReturnValue({
                fetchSockets: jest.fn().mockResolvedValue([mockSocket, mockOpponentSocket]),
            } as any);

            const startCombatTurnsSpy = jest.spyOn(gateway, 'startCombatTurns');

            await gateway.startCombat(mockSocket, { gameId: 'game-id', opponent: mockCombat.opponent });

            expect(mockSocket.join).toHaveBeenCalledWith(mockCombat.id);
            expect(mockOpponentSocket.join).toHaveBeenCalledWith(mockCombat.id);

            expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
            expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith(CombatEvents.CombatStarted, {
                challenger: mockCombat.challenger,
                opponent: mockCombat.opponent,
            });
            expect(combatCountdownService.initCountdown).toHaveBeenCalledWith('game-id', 5);
            expect(gameCountdownService.pauseCountdown).toHaveBeenCalledWith('game-id');

            expect(startCombatTurnsSpy).toHaveBeenCalledWith('game-id');

            expect(journalService.logMessage).toHaveBeenCalledWith(
                'game-id',
                `${mockCombat.challenger.name} a commencé un combat contre ${mockCombat.opponent.name}.`,
                [mockCombat.challenger.name],
            );

            startCombatTurnsSpy.mockRestore();
        });

        it('should handle virtual opponent socket correctly', async () => {
            const mockGame = { id: 'game-id', currentTurn: 0, players: [mockCombat.challenger, mockCombat.opponent] } as Game;
            gameCreationService.getGameById.mockReturnValue(mockGame);
            gameCreationService.getPlayer.mockReturnValue(mockCombat.challenger);
            const virtualOpponent = { ...mockCombat.opponent, socketId: 'virtual-opponent-id' };

            await gateway.startCombat(mockSocket, { gameId: 'game-id', opponent: virtualOpponent });

            expect(mockSocket.join).toHaveBeenCalledWith(mockCombat.id);
            expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
            expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith(CombatEvents.CombatStarted, {
                challenger: mockCombat.challenger,
                opponent: virtualOpponent,
            });
            expect(combatCountdownService.initCountdown).toHaveBeenCalledWith('game-id', 5);
            expect(gameCountdownService.pauseCountdown).toHaveBeenCalledWith('game-id');
            expect(journalService.logMessage).toHaveBeenCalledWith(
                'game-id',
                `${mockCombat.challenger.name} a commencé un combat contre ${virtualOpponent.name}.`,
                [mockCombat.challenger.name],
            );
        });

        it('should not proceed if the game is not found', async () => {
            gameCreationService.getGameById.mockReturnValue(undefined);

            await gateway.startCombat(mockSocket, { gameId: 'invalid-game-id', opponent: mockCombat.opponent });

            expect(serverCombatService.createCombat).not.toHaveBeenCalled();
            expect(mockSocket.join).not.toHaveBeenCalled();
            expect(combatCountdownService.initCountdown).not.toHaveBeenCalled();
            expect(gameCountdownService.pauseCountdown).not.toHaveBeenCalled();
        });

        it('should not proceed if opponent socket is not found', async () => {
            const mockGame = { id: 'game-id', players: [mockCombat.challenger, mockCombat.opponent] } as Game;
            gameCreationService.getGameById.mockReturnValue(mockGame);
            gameCreationService.getPlayer.mockReturnValue(mockCombat.challenger);
            mockServer.in.mockReturnValue({
                fetchSockets: jest.fn().mockResolvedValue([mockSocket]),
            } as any);

            await gateway.startCombat(mockSocket, { gameId: 'game-id', opponent: mockCombat.opponent });

            expect(mockOpponentSocket.join).not.toHaveBeenCalled();
            expect(mockServer.to(mockCombat.id).emit).not.toHaveBeenCalledWith(CombatEvents.CombatStarted, expect.anything());
        });

        it('should set the challenger as the current player and opponent as the other player', () => {
            mockCombat.currentTurnSocketId = mockCombat.challenger.socketId;

            gateway.startCombatTurns(mockCombat.id);

            expect(mockServer.to).toHaveBeenCalledWith(mockCombat.currentTurnSocketId);
            expect(mockServer.to(mockCombat.currentTurnSocketId).emit).toHaveBeenCalledWith(CombatEvents.YourTurnCombat);
            expect(mockServer.to(mockCombat.opponent.socketId).emit).toHaveBeenCalledWith(CombatEvents.PlayerTurnCombat);
        });

        it('should set the opponent as the current player and challenger as the other player', () => {
            mockCombat.currentTurnSocketId = mockCombat.opponent.socketId;

            gateway.startCombatTurns(mockCombat.id);

            expect(mockServer.to).toHaveBeenCalledWith(mockCombat.currentTurnSocketId);
            expect(mockServer.to(mockCombat.currentTurnSocketId).emit).toHaveBeenCalledWith(CombatEvents.YourTurnCombat);
            expect(mockServer.to(mockCombat.challenger.socketId).emit).toHaveBeenCalledWith(CombatEvents.PlayerTurnCombat);
            mockCombat.currentTurnSocketId = mockCombat.challenger.socketId;
        });
    });

    describe('cleanupCombatRoom', () => {
        it('should remove all sockets from combat room', async () => {
            await gateway.cleanupCombatRoom(mockCombat.id);

            expect(mockSocket.leave).toHaveBeenCalledWith(mockCombat.id);
            expect(mockOpponentSocket.leave).toHaveBeenCalledWith(mockCombat.id);
        });
    });

    describe('CombatGateway Additional Tests', () => {
        describe('startCombat', () => {
            it('should emit combatStarted and initialize countdowns', async () => {
                const mockGame = { id: 'game-id', currentTurn: 0, players: [mockCombat.challenger, mockCombat.opponent] } as Game;
                gameCreationService.getGameById.mockReturnValue(mockGame);
                gameCreationService.getPlayer.mockReturnValue(mockCombat.challenger);

                await gateway.startCombat(mockSocket, { gameId: 'game-id', opponent: mockCombat.opponent });

                expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
                expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith(CombatEvents.CombatStarted, {
                    challenger: mockCombat.challenger,
                    opponent: mockCombat.opponent,
                });
                expect(combatCountdownService.initCountdown).toHaveBeenCalledWith('game-id', 5);
                expect(gameCountdownService.pauseCountdown).toHaveBeenCalledWith('game-id');
                expect(gameManagerService.updatePlayerActions).toHaveBeenCalledWith('game-id', mockSocket.id);
            });
        });

        describe('attack', () => {
            it('should call attackOnTimeOut when attack message is received', () => {
                const spy = jest.spyOn(gateway, 'attackOnTimeOut');

                gateway.attack(mockSocket, 'game-id');

                expect(spy).toHaveBeenCalledWith('game-id');
            });

            it('should emit dice roll and attack success on timeout', () => {
                gateway.attack(mockSocket, 'game-id');

                expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
                expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith(CombatEvents.DiceRolled, {
                    attackDice: 5,
                    defenseDice: 3,
                });
            });
        });

        describe('afterInit', () => {
            it('should set the server and subscribe to the timeout event', () => {
                const attackOnTimeOutSpy = jest.spyOn(gateway, 'attackOnTimeOut');

                gateway.afterInit();

                expect(combatCountdownService.setServer).toHaveBeenCalledWith(gateway.server);

                const gameId = 'test-game-id';
                const timeoutCallback = combatCountdownService.on.mock.calls.find((call) => call[0] === 'timeout')[1];
                timeoutCallback(gameId);

                expect(attackOnTimeOutSpy).toHaveBeenCalledWith(gameId);
            });
        });

        describe('startEvasion', () => {
            it('should not emit evasion if evasion points are zero', async () => {
                mockCombat.challenger.specs.evasions = 0;
                await gateway.startEvasion(mockSocket, 'game-id');

                expect(mockServer.to(mockCombat.id).emit).not.toHaveBeenCalled();
            });
        });

        describe('prepareNextTurn', () => {
            it('should update turn and reset timer for next turn', () => {
                gateway.prepareNextTurn('game-id');

                expect(serverCombatService.updateTurn).toHaveBeenCalledWith('game-id');
                expect(combatCountdownService.resetTimerSubscription).toHaveBeenCalledWith('game-id');
            });
        });

        describe('startCombatTurns', () => {
            it('should emit yourTurnCombat for the current player', () => {
                gateway.startCombatTurns('game-id');

                expect(mockServer.to).toHaveBeenCalledWith(mockCombat.currentTurnSocketId);
                expect(mockServer.to(mockCombat.currentTurnSocketId).emit).toHaveBeenCalledWith(CombatEvents.YourTurnCombat);
            });

            it('should start turn counter with evasion disabled if current player has no evasions', () => {
                const mockGame = { id: 'game-id', currentTurn: 0, players: [mockCombat.challenger, mockCombat.opponent] } as Game;
                mockCombat.challenger.specs.evasions = 0;
                gameCreationService.getGameById.mockReturnValue(mockGame);
                serverCombatService.getCombatByGameId.mockReturnValue(mockCombat);

                gateway.startCombatTurns('game-id');

                expect(combatCountdownService.startTurnCounter).toHaveBeenCalledWith(mockGame, false);
            });

            it('should handle virtual player combat and emit CombatFinishedByEvasion if evasion is successful', () => {
                const mockGame = { id: 'game-id', currentTurn: 0, players: [mockCombat.challenger, mockCombat.opponent] } as Game;
                mockCombat.currentTurnSocketId = 'game-id';
                gameCreationService.getGameById.mockReturnValue(mockGame);
                serverCombatService.getCombatByGameId.mockReturnValue(mockCombat);
                virtualGameManager.handleVirtualPlayerCombat.mockReturnValue(true);

                gateway.startCombatTurns('game-id');

                expect(mockServer.to).toHaveBeenCalled();
                expect(mockServer.to('game-id').emit).toHaveBeenCalled();
            });

            it('should handle virtual player combat and prepare for next turn if evasion is not successful', () => {
                const mockGame = { id: 'game-id', currentTurn: 0, players: [mockCombat.challenger, mockCombat.opponent] } as Game;
                mockCombat.currentTurnSocketId = 'virtual-socket-id';
                gameCreationService.getGameById.mockReturnValue(mockGame);
                serverCombatService.getCombatByGameId.mockReturnValue(mockCombat);
                virtualGameManager.handleVirtualPlayerCombat.mockReturnValue(false);
                mockCombat.opponent.specs.life = 1;

                const prepareNextTurnSpy = jest.spyOn(gateway, 'prepareNextTurn');

                gateway.startCombatTurns('game-id');

                expect(mockServer.to).toHaveBeenCalled();
                expect(mockServer.to('game-id').emit).toHaveBeenCalled();

                prepareNextTurnSpy.mockRestore();
            });
        });

        describe('handleDisconnect', () => {
            it('should emit "gameClosed" if the disconnected player is the host and game has not started', () => {
                const mockGame = { id: 'game-id', hasStarted: false, players: [mockCombat.challenger] } as Game;
                gameCreationService.getGames.mockReturnValue([mockGame]);
                gameCreationService.isPlayerHost.mockReturnValue(true);

                gateway.handleDisconnect(mockSocket);

                expect(mockServer.to).toHaveBeenCalledWith('game-id');
                expect(mockServer.to('game-id').emit).toHaveBeenCalledWith(GameCreationEvents.GameClosed);
                expect(gameCreationService.deleteRoom).toHaveBeenCalledWith('game-id');
            });

            it('should emit "playerLeft" if a non-host player disconnects', () => {
                const mockGame = { id: 'game-id', hasStarted: true, players: [mockCombat.challenger] } as Game;
                gameCreationService.getGames.mockReturnValue([mockGame]);
                gameCreationService.isPlayerHost.mockReturnValue(false);
                gameCreationService.handlePlayerLeaving.mockReturnValue(mockGame);

                gateway.handleDisconnect(mockSocket);

                expect(mockServer.to).toHaveBeenCalledWith('game-id');
                expect(mockServer.to('game-id').emit).toHaveBeenCalledWith(GameCreationEvents.PlayerLeft, mockGame.players);
            });

            it('should emit "combatFinishedByDisconnection" if player disconnects during combat', () => {
                const mockGame = { id: 'game-id', hasStarted: true, players: [mockCombat.challenger] } as Game;
                const mockWinner = mockCombat.opponent;
                gameCreationService.getGames.mockReturnValue([mockGame]);
                gameCreationService.handlePlayerLeaving.mockReturnValue(mockGame);
                serverCombatService.getCombatByGameId.mockReturnValue(mockCombat);

                gateway.handleDisconnect(mockSocket);

                expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
                expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith(CombatEvents.CombatFinishedByDisconnection, mockWinner);
                expect(combatCountdownService.deleteCountdown).toHaveBeenCalledWith('game-id');
            });

            it('should exit early if checkForGameWinner returns true', () => {
                const mockGame = {
                    id: 'game-id',
                    hasStarted: true,
                    currentTurn: mockCombat.challenger.turn,
                    players: [
                        { socketId: mockCombat.challenger.socketId, turn: mockCombat.challenger.turn, name: mockCombat.challenger.name } as Player,
                        { socketId: mockCombat.opponent.socketId, turn: mockCombat.opponent.turn, name: mockCombat.opponent.name } as Player,
                    ],
                } as Game;

                gameCreationService.getGames.mockReturnValue([mockGame]);
                gameCreationService.handlePlayerLeaving.mockReturnValue(mockGame);
                serverCombatService.checkForGameWinner.mockReturnValue(true);

                gateway.handleDisconnect(mockSocket);

                expect(gameCountdownService.resumeCountdown).not.toHaveBeenCalled();
                expect(gameCountdownService.emit).not.toHaveBeenCalled();
            });

            it('should do nothing if no conditions are met', () => {
                const mockGame = { id: 'game-id', hasStarted: true, players: [mockCombat.challenger] } as Game;
                gameCreationService.getGames.mockReturnValue([mockGame]);
                serverCombatService.checkForGameWinner.mockReturnValue(false);
                gameCreationService.handlePlayerLeaving.mockReturnValue(mockGame);

                gateway.handleDisconnect(mockSocket);

                expect(gameCountdownService.resumeCountdown).not.toHaveBeenCalled();
                expect(gameCountdownService.emit).not.toHaveBeenCalled();
            });

            it('should resume the game countdown if the winner’s turn matches the current turn after a player disconnects', () => {
                jest.useFakeTimers();
                const mockGame = {
                    id: 'game-id',
                    hasStarted: true,
                    currentTurn: mockCombat.opponent.turn,
                    players: [
                        {
                            socketId: mockCombat.challenger.socketId,
                            turn: mockCombat.challenger.turn,
                            name: mockCombat.challenger.name,
                            specs: mockCombat.challenger.specs,
                        } as Player,
                        {
                            socketId: mockCombat.opponent.socketId,
                            turn: mockCombat.opponent.turn,
                            name: mockCombat.opponent.name,
                            specs: mockCombat.opponent.specs,
                        } as Player,
                    ],
                } as Game;

                mockCombat.challenger.specs.nVictories = 1;
                mockCombat.opponent.specs.nVictories = 1;

                gameCreationService.getGames.mockReturnValue([mockGame]);
                gameCreationService.handlePlayerLeaving.mockReturnValue(mockGame);
                serverCombatService.getCombatByGameId.mockReturnValue(mockCombat);

                gateway.handleDisconnect(mockSocket);

                jest.runAllTimers();

                expect(gameCountdownService.resumeCountdown).toHaveBeenCalledWith(mockGame.id);
            });

            it('should emit "timeout" if there is no active combat and the disconnected player’s turn matches the current game turn', () => {
                jest.useFakeTimers();

                const mockGame = {
                    id: 'game-id',
                    hasStarted: true,
                    currentTurn: mockCombat.challenger.turn,
                    players: [
                        {
                            socketId: mockCombat.challenger.socketId,
                            turn: mockCombat.challenger.turn,
                            name: mockCombat.challenger.name,
                            specs: mockCombat.challenger.specs,
                        } as Player,
                        {
                            socketId: mockCombat.opponent.socketId,
                            turn: mockCombat.opponent.turn,
                            name: mockCombat.opponent.name,
                            specs: mockCombat.opponent.specs,
                        } as Player,
                    ],
                } as Game;

                serverCombatService.getCombatByGameId.mockReturnValue(undefined);

                gameCreationService.getGames.mockReturnValue([mockGame]);
                gameCreationService.handlePlayerLeaving.mockReturnValue(mockGame);

                gateway.handleDisconnect(mockSocket);
                jest.runAllTimers();

                expect(gameCountdownService.emit).toHaveBeenCalledWith('timeout', mockGame.id);
            });
            it('should emit "dropItem" if there is no active combat and the disconnected player’s turn matches the current game turn and his inventory is not empty', () => {
                jest.useFakeTimers();

                const mockGame = {
                    id: 'game-id',
                    hasStarted: true,
                    currentTurn: mockCombat.challenger.turn,
                    players: [
                        {
                            socketId: mockCombat.challenger.socketId,
                            turn: mockCombat.challenger.turn,
                            name: mockCombat.challenger.name,
                            specs: mockCombat.challenger.specs,
                            inventory: [ItemCategory.Amulet, ItemCategory.Sword],
                        } as Player,
                        {
                            socketId: mockCombat.opponent.socketId,
                            turn: mockCombat.opponent.turn,
                            name: mockCombat.opponent.name,
                            specs: mockCombat.opponent.specs,
                            inventory: [ItemCategory.Flag],
                        } as Player,
                    ],
                } as Game;

                serverCombatService.getCombatByGameId.mockReturnValue(undefined);
                gameCreationService.getGames.mockReturnValue([mockGame]);
                gameCreationService.handlePlayerLeaving.mockReturnValue(mockGame);

                gateway.handleDisconnect(mockSocket);
                jest.runAllTimers();

                expect(mockServer.to(mockGame.id).emit).toHaveBeenCalledWith(GameCreationEvents.PlayerLeft, mockGame.players);

                // Update the expectation to match the emitted data structure
                expect(mockServer.to(mockGame.id).emit).toHaveBeenCalledWith(ItemsEvents.ItemDropped, {
                    updatedGame: mockGame,
                    updatedPlayer: {
                        socketId: mockCombat.challenger.socketId,
                        turn: mockCombat.challenger.turn,
                        name: mockCombat.challenger.name,
                        specs: mockCombat.challenger.specs,
                        inventory: [ItemCategory.Amulet, ItemCategory.Sword],
                    },
                });

                expect(gameCountdownService.emit).toHaveBeenCalledWith('timeout', mockGame.id);
            });
        });
    });
});
