import { Combat } from '@common/combat';
import { Avatar, Bonus, Game } from '@common/game';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { ServerCombatService } from '../../service/combat/combat.service';
import { CombatCountdownService } from '../../service/countdown/combat/combat-countdown.service';
import { GameCountdownService } from '../../service/countdown/game/game-countdown.service';
import { GameCreationService } from '../../service/game-creation/game-creation.service';
import { JournalService } from '../../service/journal/journal.service';
import { CombatGateway } from './combat.gateway';

describe('CombatGateway', () => {
    let gateway: CombatGateway;
    let serverCombatService: jest.Mocked<ServerCombatService>;
    let combatCountdownService: jest.Mocked<CombatCountdownService>;
    let gameCountdownService: jest.Mocked<GameCountdownService>;
    let gameCreationService: jest.Mocked<GameCreationService>;
    let mockServer: jest.Mocked<Server>;
    let mockSocket: jest.Mocked<Socket>;
    let mockOpponentSocket: jest.Mocked<Socket>;

    const mockCombat: Combat = {
        id: 'combat-id',
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
            },
            inventory: [],
            position: undefined,
            initialPosition: undefined,
            turn: 0,
            visitedTiles: [],
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
            },
            inventory: [],
            position: undefined,
            initialPosition: undefined,
            turn: 1,
            visitedTiles: [],
        },
        challengerLife: 5,
        opponentLife: 5,
        currentTurnSocketId: 'socket-id',
    };

    beforeEach(async () => {
        jest.useFakeTimers();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CombatGateway,
                {
                    provide: ServerCombatService,
                    useValue: {
                        createCombat: jest.fn().mockReturnValue(mockCombat),
                        getCombatByGameId: jest.fn().mockReturnValue(mockCombat),
                        rollDice: jest.fn().mockReturnValue({ attackDice: 5, defenseDice: 3 }),
                        isAttackSuccess: jest.fn().mockReturnValue(true),
                        combatWinStatsUpdate: jest.fn(),
                        sendBackToInitPos: jest.fn(),
                        updatePlayersInGame: jest.fn(),
                        updateTurn: jest.fn(),
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
                    provide: GameCreationService,
                    useValue: {
                        getGameById: jest.fn(),
                        getPlayer: jest.fn(),
                        getGames: jest.fn(),
                    },
                },
                {
                    provide: JournalService,
                    useValue: {
                        initializeServer: jest.fn(),
                        logMessage: jest.fn(),
                    },
                },
            ],
        }).compile();

        gateway = module.get<CombatGateway>(CombatGateway);
        serverCombatService = module.get(ServerCombatService);
        combatCountdownService = module.get(CombatCountdownService);
        gameCountdownService = module.get(GameCountdownService);
        gameCreationService = module.get(GameCreationService);

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
            expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith('diceRolled', {
                attackDice: 5,
                defenseDice: 3,
            });
            expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith('attackSuccess', mockCombat.opponent);
        });
    });

    describe('startEvasion', () => {
        it('should emit evasion success and resume game countdown', async () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.3); // Mock evasion success
            gameCreationService.getGameById.mockReturnValue({ id: 'game-id' } as Game);

            await gateway.startEvasion(mockSocket, 'game-id');
            jest.runAllTimers();

            expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
            expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith('evasionSuccess', mockCombat.challenger);
            expect(combatCountdownService.deleteCountdown).toHaveBeenCalledWith('game-id');
            expect(gameCountdownService.resumeCountdown).toHaveBeenCalledWith('game-id');
        });

        it('should not emit evasion if evasion points are zero', async () => {
            mockCombat.challenger.specs.evasions = 0;
            await gateway.startEvasion(mockSocket, 'game-id');

            expect(mockServer.to(mockCombat.id).emit).not.toHaveBeenCalledWith('evasionSuccess');
        });
    });

    describe('CombatGateway Additional Tests', () => {
        describe('startCombat', () => {
            it('should emit combatStarted, initialize countdowns, and start combat turns', async () => {
                const mockGame = { id: 'game-id' } as Game;
                gameCreationService.getGameById.mockReturnValue(mockGame);
                gameCreationService.getPlayer.mockReturnValue(mockCombat.challenger);
                mockServer.in.mockReturnValue({
                    fetchSockets: jest.fn().mockResolvedValue([mockSocket, mockOpponentSocket]),
                } as any);

                // Spy on startCombatTurns
                const startCombatTurnsSpy = jest.spyOn(gateway, 'startCombatTurns');

                await gateway.startCombat(mockSocket, { gameId: 'game-id', opponent: mockCombat.opponent });

                // Check that combat was created and players joined the combat room
                expect(serverCombatService.createCombat).toHaveBeenCalledWith('game-id', mockCombat.challenger, mockCombat.opponent);
                expect(mockSocket.join).toHaveBeenCalledWith(mockCombat.id);
                expect(mockOpponentSocket.join).toHaveBeenCalledWith(mockCombat.id);

                // Verify that combat started event was emitted to the correct room
                expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
                expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith('combatStarted', {
                    challenger: mockCombat.challenger,
                    opponent: mockCombat.opponent,
                });
                expect(combatCountdownService.initCountdown).toHaveBeenCalledWith('game-id', 5);
                expect(gameCountdownService.pauseCountdown).toHaveBeenCalledWith('game-id');

                expect(startCombatTurnsSpy).toHaveBeenCalledWith('game-id');

                startCombatTurnsSpy.mockRestore();
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
                const mockGame = { id: 'game-id' } as Game;
                gameCreationService.getGameById.mockReturnValue(mockGame);
                gameCreationService.getPlayer.mockReturnValue(mockCombat.challenger);
                mockServer.in.mockReturnValue({
                    fetchSockets: jest.fn().mockResolvedValue([mockSocket]),
                } as any);

                await gateway.startCombat(mockSocket, { gameId: 'game-id', opponent: mockCombat.opponent });

                expect(mockOpponentSocket.join).not.toHaveBeenCalled();
                expect(mockServer.to(mockCombat.id).emit).not.toHaveBeenCalledWith('combatStarted', expect.anything());
            });
        });

        describe('attack', () => {
            it('should emit dice roll and attack success on timeout', () => {
                gateway.attack(mockSocket, 'game-id');

                expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
                expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith('diceRolled', {
                    attackDice: 5,
                    defenseDice: 3,
                });
                expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith('attackSuccess', mockCombat.opponent);
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
                    const mockGame = { id: 'game-id' } as Game;
                    gameCreationService.getGameById.mockReturnValue(mockGame);
                    gameCreationService.getPlayer.mockReturnValue(mockCombat.challenger);

                    await gateway.startCombat(mockSocket, { gameId: 'game-id', opponent: mockCombat.opponent });

                    expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
                    expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith('combatStarted', {
                        challenger: mockCombat.challenger,
                        opponent: mockCombat.opponent,
                    });
                    expect(combatCountdownService.initCountdown).toHaveBeenCalledWith('game-id', 5);
                    expect(gameCountdownService.pauseCountdown).toHaveBeenCalledWith('game-id');
                });

                it('should handle case where game or player is not found', async () => {
                    gameCreationService.getGameById.mockReturnValue(undefined);

                    await gateway.startCombat(mockSocket, { gameId: 'invalid-game-id', opponent: mockCombat.opponent });

                    expect(mockServer.to(mockCombat.id).emit).not.toHaveBeenCalled();
                });
            });

            describe('attack', () => {
                it('should call attackOnTimeOut when attack message is received', () => {
                    const spy = jest.spyOn(gateway, 'attackOnTimeOut');

                    gateway.attack(mockSocket, 'game-id');

                    expect(spy).toHaveBeenCalledWith('game-id');
                });
            });

            describe('attackOnTimeOut', () => {
                it('should emit dice roll and attack success', () => {
                    gateway.attackOnTimeOut('game-id');

                    expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
                    expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith('diceRolled', {
                        attackDice: 5,
                        defenseDice: 3,
                    });
                    expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith('attackSuccess', mockCombat.opponent);
                });

                it('should emit dice roll and attack failure', () => {
                    serverCombatService.isAttackSuccess.mockReturnValue(false);
                    gateway.attackOnTimeOut('game-id');

                    expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
                    expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith('diceRolled', {
                        attackDice: 5,
                        defenseDice: 3,
                    });
                    expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith('attackFailure', mockCombat.opponent);
                });

                it("should emit combatFinished if opponent's life reaches zero", () => {
                    const mockGame = { id: 'game-id', currentTurn: mockCombat.challenger.turn } as Game;
                    gameCreationService.getGameById.mockReturnValue(mockGame);
                    mockCombat.opponent.specs.life = 1;
                    gateway.attackOnTimeOut('game-id');

                    expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith('combatFinishedNormally', mockCombat.challenger);
                });

                it("should emit combatFinished if challenger's life reaches zero", () => {
                    const mockGame = { id: 'game-id', currentTurn: mockCombat.challenger.turn } as Game;
                    gameCreationService.getGameById.mockReturnValue(mockGame);
                    serverCombatService.isAttackSuccess.mockReturnValue(false);
                    mockCombat.challenger.specs.life = 1;
                    gateway.attackOnTimeOut('game-id');

                    expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith('attackFailure', mockCombat.opponent);
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

                    expect(mockServer.to(mockCombat.id).emit).not.toHaveBeenCalledWith('evasionSuccess');
                });
                it('should not emit evasion if opponont evasion points are zero', async () => {
                    mockCombat.opponent.specs.evasions = 0;
                    await gateway.startEvasion(mockOpponentSocket, 'game-id');
                    expect(mockServer.to(mockCombat.id).emit).not.toHaveBeenCalledWith('evasionSuccess');
                });
                it('should not emit evasion success', async () => {
                    mockCombat.opponent.specs.evasions = 1;
                    jest.spyOn(Math, 'random').mockReturnValue(0.5);
                    await gateway.startEvasion(mockOpponentSocket, 'game-id');
                    expect(mockServer.to(mockCombat.id).emit).not.toHaveBeenCalledWith('evasionSuccess');
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
                    expect(mockServer.to(mockCombat.currentTurnSocketId).emit).toHaveBeenCalledWith('yourTurnCombat');
                });
                it('should emit yourTurnCombat for the current player', () => {
                    mockCombat.currentTurnSocketId = 'opponent-id';
                    gateway.startCombatTurns('game-id');

                    expect(mockServer.to).toHaveBeenCalledWith(mockCombat.currentTurnSocketId);
                    expect(mockServer.to(mockCombat.currentTurnSocketId).emit).toHaveBeenCalledWith('yourTurnCombat');
                });
            });
        });
    });
    describe('handleDisconnect', () => {
        beforeEach(() => {
            gameCreationService.getGames.mockReturnValue([{ id: 'game-id', currentTurn: mockCombat.challenger.turn, players: [mockCombat.challenger, mockCombat.opponent] } as Game]);
            serverCombatService.getCombatByGameId.mockReturnValue(mockCombat);
            gameCreationService.getGameById.mockReturnValue({
                id: 'game-id',
                players: [mockCombat.challenger, mockCombat.opponent],
                currentTurn: mockCombat.challenger.turn,
            } as Game);

            Object.defineProperty(mockSocket, 'id', { value: mockCombat.challenger.socketId });
            Object.defineProperty(mockSocket, 'rooms', { value: new Set([`${mockCombat.id}`]) });
        });

        it('should have the disconnecting player leave the combat room if they are in it', async () => {
            await gateway.handleDisconnect(mockSocket as Socket);

            expect(mockSocket.leave).toHaveBeenCalledWith(mockCombat.id);
        });

        it('should emit playerLeftCombat if the challenger disconnects', async () => {
            await gateway.handleDisconnect(mockSocket as Socket);

            expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
            expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith('combatFinishedByDisconnection', mockCombat.opponent);
        });

        it('should emit playerLeftCombat if the opponent disconnects', async () => {
            Object.defineProperty(mockSocket, 'id', { value: mockCombat.opponent.socketId });
            await gateway.handleDisconnect(mockSocket as Socket);

            expect(mockServer.to).toHaveBeenCalledWith(mockCombat.id);
            expect(mockServer.to(mockCombat.id).emit).toHaveBeenCalledWith('combatFinishedByDisconnection', mockCombat.challenger);
        });
    });
});
