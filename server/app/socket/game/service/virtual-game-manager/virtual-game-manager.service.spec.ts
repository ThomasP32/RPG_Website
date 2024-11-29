import { Combat } from '@common/combat';
import { ProfileType } from '@common/constants';
import { CombatEvents } from '@common/events/combat.events';
import { Game, Player } from '@common/game';
import { Coordinate, Item } from '@common/map.types';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';
import { CombatService } from '../combat/combat.service';
import { CombatCountdownService } from '../countdown/combat/combat-countdown.service';
import { GameCountdownService } from '../countdown/game/game-countdown.service';
import { GameCreationService } from '../game-creation/game-creation.service';
import { GameManagerService } from '../game-manager/game-manager.service';
import { ItemsManagerService } from '../items-manager/items-manager.service';
import { JournalService } from '../journal/journal.service';
import { VirtualGameManagerService } from './virtual-game-manager.service';

describe('VirtualGameManagerService', () => {
    let service: VirtualGameManagerService;
    let gameCreationService: GameCreationService;
    let gameManagerService: GameManagerService;
    let combatService: CombatService;
    let journalService: JournalService;
    let combatCountdownService: CombatCountdownService;
    let gameCountdownService: GameCountdownService;
    let itemsManagerService: ItemsManagerService;
    let server: Server;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VirtualGameManagerService,
                {
                    provide: GameCreationService,
                    useValue: {
                        getGameById: jest.fn(),
                    },
                },
                {
                    provide: GameManagerService,
                    useValue: {
                        getMoves: jest.fn(),
                        onIceTile: jest.fn(),
                        updatePosition: jest.fn(),
                        checkForWinnerCtf: jest.fn(),
                        getAdjacentPlayers: jest.fn(),
                        getMove: jest.fn(),
                        updatePlayerActions: jest.fn(),
                    },
                },
                {
                    provide: CombatService,
                    useValue: {
                        createCombat: jest.fn(),
                        rollDice: jest.fn(),
                        isAttackSuccess: jest.fn(),
                        handleAttackSuccess: jest.fn(),
                        getCombatByGameId: jest.fn(),
                        updatePlayersInGame: jest.fn(),
                    },
                },
                {
                    provide: JournalService,
                    useValue: {
                        logMessage: jest.fn(),
                    },
                },
                {
                    provide: CombatCountdownService,
                    useValue: {
                        initCountdown: jest.fn(),
                        deleteCountdown: jest.fn(),
                        startTurnCounter: jest.fn(),
                    },
                },
                {
                    provide: GameCountdownService,
                    useValue: {
                        pauseCountdown: jest.fn(),
                    },
                },
                {
                    provide: ItemsManagerService,
                    useValue: {
                        pickUpItem: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<VirtualGameManagerService>(VirtualGameManagerService);
        gameCreationService = module.get<GameCreationService>(GameCreationService);
        gameManagerService = module.get<GameManagerService>(GameManagerService);
        combatService = module.get<CombatService>(CombatService);
        journalService = module.get<JournalService>(JournalService);
        combatCountdownService = module.get<CombatCountdownService>(CombatCountdownService);
        gameCountdownService = module.get<GameCountdownService>(GameCountdownService);
        itemsManagerService = module.get<ItemsManagerService>(ItemsManagerService);
        server = new Server();
        service.setServer(server);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('executeVirtualPlayerBehavior', () => {
        it('should execute aggressive behavior for aggressive profile', () => {
            const player: Player = { profile: ProfileType.AGGRESSIVE } as Player;
            const game: Game = {} as Game;
            jest.spyOn(service, 'executeAggressiveBehavior').mockImplementation();

            service.executeVirtualPlayerBehavior(player, game);

            expect(service.executeAggressiveBehavior).toHaveBeenCalledWith(player, game);
        });

        it('should execute defensive behavior for defensive profile', () => {
            const player: Player = { profile: ProfileType.DEFENSIVE } as Player;
            const game: Game = {} as Game;
            jest.spyOn(service, 'executeDefensiveBehavior').mockImplementation();

            service.executeVirtualPlayerBehavior(player, game);

            expect(service.executeDefensiveBehavior).toHaveBeenCalledWith(player, game);
        });
    });

    describe('calculateVirtualPlayerPath', () => {
        it('should return an empty array if only one possible move', () => {
            const player: Player = {} as Player;
            const game: Game = { id: 'gameId' } as Game;
            jest.spyOn(gameManagerService, 'getMoves').mockReturnValue([['move1', { path: [], weight: 1 }]]);

            const result = service.calculateVirtualPlayerPath(player, game);

            expect(result).toEqual([]);
        });
    });

    describe('updateVirtualPlayerPosition', () => {
        it('should return false if path length is 0', async () => {
            const player: Player = {} as Player;
            const gameId = 'gameId';
            const game: Game = { id: gameId } as Game;
            jest.spyOn(gameCreationService, 'getGameById').mockReturnValue(game);
            jest.spyOn(service, 'calculateVirtualPlayerPath').mockReturnValue([]);

            const result = await service.updateVirtualPlayerPosition(player, gameId);

            expect(result).toBe(false);
        });

        it('should return true if path length is greater than 0', async () => {
            const player: Player = {} as Player;
            const gameId = 'gameId';
            const game: Game = { id: gameId } as Game;
            jest.spyOn(gameCreationService, 'getGameById').mockReturnValue(game);
            jest.spyOn(service, 'calculateVirtualPlayerPath').mockReturnValue([{ x: 0, y: 0 }]);
            jest.spyOn(service, 'updatePosition').mockResolvedValue();

            const result = await service.updateVirtualPlayerPosition(player, gameId);

            expect(result).toBe(true);
        });
    });

    describe('updatePosition', () => {
        it('should update player position and emit events', async () => {
            const player: Player = { socketId: 'socketId', position: { x: 0, y: 0 } } as Player;
            const path: Coordinate[] = [{ x: 1, y: 1 }];
            const gameId = 'gameId';
            const game: Game = { id: gameId } as Game;
            jest.spyOn(gameCreationService, 'getGameById').mockReturnValue(game);
            jest.spyOn(gameManagerService, 'updatePosition').mockImplementation();
            jest.spyOn(gameManagerService, 'checkForWinnerCtf').mockReturnValue(false);
            jest.spyOn(server, 'to').mockReturnValue({ emit: jest.fn() } as any);

            await service.updatePosition(player, path, gameId, false);

            expect(gameManagerService.updatePosition).toHaveBeenCalledWith(gameId, player.socketId, [path[0]]);
            expect(server.to).toHaveBeenCalledWith(gameId);
        });
    });

    describe('adaptSpecsForIceTileMove', () => {
        it('should decrease specs if player moves onto ice tile', () => {
            const player: Player = { specs: { attack: 10, defense: 10 } } as Player;
            const gameId = 'gameId';
            jest.spyOn(gameManagerService, 'onIceTile').mockReturnValue(true);

            const result = service.adaptSpecsForIceTileMove(player, gameId, false);

            expect(player.specs.attack).toBe(8);
            expect(player.specs.defense).toBe(8);
            expect(result).toBe(true);
        });

        it('should increase specs if player moves off ice tile', () => {
            const player: Player = { specs: { attack: 8, defense: 8 } } as Player;
            const gameId = 'gameId';
            jest.spyOn(gameManagerService, 'onIceTile').mockReturnValue(false);

            const result = service.adaptSpecsForIceTileMove(player, gameId, true);

            expect(player.specs.attack).toBe(10);
            expect(player.specs.defense).toBe(10);
            expect(result).toBe(false);
        });
    });

    describe('executeAggressiveBehavior', () => {
        it('should update position and pick up sword if visible', async () => {
            const player: Player = { specs: { actions: 1 }, socketId: 'socketId' } as Player;
            const game: Game = { id: 'gameId', players: [], items: [{ category: 'sword', coordinate: { x: 1, y: 1 } }] } as Game;
            jest.spyOn(gameManagerService, 'getMoves').mockReturnValue([]);
            jest.spyOn(service, 'getAdjacentTilesToPossibleMoves').mockReturnValue([]);
            jest.spyOn(service, 'getPlayersInArea').mockReturnValue([]);
            jest.spyOn(service, 'getItemsInArea').mockReturnValue(game.items);
            jest.spyOn(service, 'updatePosition').mockResolvedValue();
            jest.spyOn(itemsManagerService, 'pickUpItem').mockImplementation();

            await service.executeAggressiveBehavior(player, game);

            expect(service.updatePosition).toHaveBeenCalledWith(player, [{ x: 1, y: 1 }], game.id, false);
            expect(itemsManagerService.pickUpItem).toHaveBeenCalledWith({ x: 1, y: 1 }, game.id, player);
        });
    });

    describe('executeDefensiveBehavior', () => {
        it('should update position and pick up armor if visible', async () => {
            const player: Player = { specs: { actions: 1 }, socketId: 'socketId' } as Player;
            const game: Game = { id: 'gameId', players: [], items: [{ category: 'armor', coordinate: { x: 1, y: 1 } }] } as Game;
            jest.spyOn(gameManagerService, 'getMoves').mockReturnValue([]);
            jest.spyOn(service, 'getAdjacentTilesToPossibleMoves').mockReturnValue([]);
            jest.spyOn(service, 'getPlayersInArea').mockReturnValue([]);
            jest.spyOn(service, 'getItemsInArea').mockReturnValue(game.items);
            jest.spyOn(service, 'updatePosition').mockResolvedValue();
            jest.spyOn(itemsManagerService, 'pickUpItem').mockImplementation();

            await service.executeDefensiveBehavior(player, game);

            expect(service.updatePosition).toHaveBeenCalledWith(player, [{ x: 1, y: 1 }], game.id, false);
            expect(itemsManagerService.pickUpItem).toHaveBeenCalledWith({ x: 1, y: 1 }, game.id, player);
        });
    });

    describe('startCombat', () => {
        it('should start combat and emit events', async () => {
            const combat = {
                id: 'combatId',
                challenger: { name: 'challenger', socketId: 'challengerSocketId' },
                opponent: { name: 'opponent', socketId: 'opponentSocketId' },
            } as Combat;
            const game: Game = { id: 'gameId' } as Game;
            jest.spyOn(server, 'in').mockReturnValue({
                fetchSockets: jest.fn().mockResolvedValue([{ id: 'opponentSocketId', join: jest.fn() }]),
            } as any);
            jest.spyOn(journalService, 'logMessage').mockImplementation();
            jest.spyOn(server, 'to').mockReturnValue({ emit: jest.fn() } as any);
            jest.spyOn(combatCountdownService, 'initCountdown').mockImplementation();
            jest.spyOn(gameCountdownService, 'pauseCountdown').mockImplementation();
            jest.spyOn(service, 'startCombatTurns').mockImplementation();

            const result = await service.startCombat(combat, game);

            expect(result).toBe(true);
            expect(journalService.logMessage).toHaveBeenCalled();
            expect(server.to).toHaveBeenCalledWith(combat.id);
            expect(combatCountdownService.initCountdown).toHaveBeenCalledWith(game.id, 5);
            expect(gameCountdownService.pauseCountdown).toHaveBeenCalledWith(game.id);
            expect(service.startCombatTurns).toHaveBeenCalledWith(game.id);
        });
    });

    describe('handleVirtualPlayerCombat', () => {
        it('should handle aggressive combat', () => {
            const player: Player = { socketId: 'virtual1', profile: ProfileType.AGGRESSIVE } as Player;
            const opponent: Player = {} as Player;
            const gameId = 'gameId';
            const combat: Combat = {} as Combat;
            jest.spyOn(service, 'handleAggressiveCombat').mockImplementation();

            const result = service.handleVirtualPlayerCombat(player, opponent, gameId, combat);

            expect(service.handleAggressiveCombat).toHaveBeenCalledWith(player, opponent, combat);
            expect(result).toBe(false);
        });

        it('should handle defensive combat', () => {
            const player: Player = {
                socketId: 'virtual1',
                profile: ProfileType.DEFENSIVE,
                specs: { evasions: 1, speed: 6, life: 3, nEvasions: 0 },
            } as Player;
            const opponent: Player = {} as Player;
            const gameId = 'gameId';
            const combat: Combat = {} as Combat;
            jest.spyOn(service, 'handleDefensiveCombat').mockReturnValue(true);

            const result = service.handleVirtualPlayerCombat(player, opponent, gameId, combat);

            expect(service.handleDefensiveCombat).toHaveBeenCalledWith(player, opponent, combat, gameId);
            expect(result).toBe(true);
        });
    });

    describe('handleAggressiveCombat', () => {
        it('should attack opponent', () => {
            const player: Player = {} as Player;
            const opponent: Player = {} as Player;
            const combat: Combat = {} as Combat;
            jest.spyOn(service, 'attack').mockImplementation();

            service.handleAggressiveCombat(player, opponent, combat);

            expect(service.attack).toHaveBeenCalledWith(player, opponent, combat);
        });
    });

    describe('handleDefensiveCombat', () => {
        it('should attempt evasion if conditions met', () => {
            const player: Player = { specs: { evasions: 1, speed: 6, life: 3, nEvasions: 0 } } as Player;
            const opponent: Player = {} as Player;
            const combat: Combat = {} as Combat;
            const gameId = 'gameId';
            jest.spyOn(service, 'attemptEvasion').mockReturnValue(true);

            const result = service.handleDefensiveCombat(player, opponent, combat, gameId);

            expect(service.attemptEvasion).toHaveBeenCalledWith(player, opponent, combat, gameId);
            expect(result).toBe(true);
        });

        it('should attack if evasion conditions not met', () => {
            const player: Player = { specs: { evasions: 0, speed: 6, life: 3, nEvasions: 0, attack: 0, defense: 0, actions: 0 } } as Player;
            const opponent: Player = {} as Player;
            const combat: Combat = {} as Combat;
            const gameId = 'gameId';
            jest.spyOn(service, 'attack').mockImplementation();

            const result = service.handleDefensiveCombat(player, opponent, combat, gameId);

            expect(service.attack).toHaveBeenCalledWith(player, opponent, combat);
            expect(result).toBe(false);
        });
    });

    describe('attack', () => {
        it('should handle attack success', () => {
            const player: Player = {} as Player;
            const opponent: Player = {} as Player;
            const combat: Combat = { id: 'combatId' } as Combat;
            const rollResult = { attackDice: 5, defenseDice: 3 };
            jest.spyOn(combatService, 'rollDice').mockReturnValue(rollResult);
            jest.spyOn(server, 'to').mockReturnValue({ emit: jest.fn() } as any);
            jest.spyOn(journalService, 'logMessage').mockImplementation();
            jest.spyOn(combatService, 'isAttackSuccess').mockReturnValue(true);
            jest.spyOn(combatService, 'handleAttackSuccess').mockImplementation();

            service.attack(player, opponent, combat);

            expect(combatService.rollDice).toHaveBeenCalledWith(player, opponent);
            expect(server.to).toHaveBeenCalledWith(combat.id);
            expect(journalService.logMessage).toHaveBeenCalled();
            expect(combatService.isAttackSuccess).toHaveBeenCalledWith(player, opponent, rollResult);
            expect(combatService.handleAttackSuccess).toHaveBeenCalledWith(player, opponent, combat.id);
        });

        it('should handle attack failure', () => {
            const player: Player = {} as Player;
            const opponent: Player = {} as Player;
            const combat: Combat = { id: 'combatId' } as Combat;
            const rollResult = { attackDice: 3, defenseDice: 5 };
            jest.spyOn(combatService, 'rollDice').mockReturnValue(rollResult);
            jest.spyOn(server, 'to').mockReturnValue({ emit: jest.fn() } as any);
            jest.spyOn(journalService, 'logMessage').mockImplementation();
            jest.spyOn(combatService, 'isAttackSuccess').mockReturnValue(false);

            service.attack(player, opponent, combat);

            expect(combatService.rollDice).toHaveBeenCalledWith(player, opponent);
            expect(server.to).toHaveBeenCalledWith(combat.id);
            expect(journalService.logMessage).toHaveBeenCalled();
            expect(combatService.isAttackSuccess).toHaveBeenCalledWith(player, opponent, rollResult);
            expect(server.to).toHaveBeenCalledWith(combat.id);
        });

        describe('attemptEvasion', () => {
            it('should return true and emit evasion success if evasion is successful', () => {
                const player: Player = { name: 'player' } as Player;
                const opponent: Player = { name: 'opponent' } as Player;
                const combat: Combat = { id: 'combatId' } as Combat;
                const gameId = 'gameId';
                const game: Game = { id: gameId } as Game;
                jest.spyOn(Math, 'random').mockReturnValue(0.3);
                jest.spyOn(gameCreationService, 'getGameById').mockReturnValue(game);
                jest.spyOn(combatService, 'updatePlayersInGame').mockImplementation();
                jest.spyOn(server, 'to').mockReturnValue({ emit: jest.fn() } as any);
                jest.spyOn(journalService, 'logMessage').mockImplementation();
                jest.spyOn(combatCountdownService, 'deleteCountdown').mockImplementation();

                const result = service.attemptEvasion(player, opponent, combat, gameId);

                expect(result).toBe(true);
                expect(combatService.updatePlayersInGame).toHaveBeenCalledWith(game);
                expect(server.to).toHaveBeenCalledWith(combat.id);
                expect(journalService.logMessage).toHaveBeenCalledWith(gameId, `Fin de combat. ${player.name} s'est évadé.`, [player.name]);
                expect(combatCountdownService.deleteCountdown).toHaveBeenCalledWith(gameId);
            });

            it('should return false and emit evasion failed if evasion is not successful', () => {
                const player: Player = { name: 'player' } as Player;
                const opponent: Player = { name: 'opponent' } as Player;
                const combat: Combat = { id: 'combatId' } as Combat;
                const gameId = 'gameId';
                jest.spyOn(Math, 'random').mockReturnValue(0.5);
                jest.spyOn(server, 'to').mockReturnValue({ emit: jest.fn() } as any);
                jest.spyOn(journalService, 'logMessage').mockImplementation();

                const result = service.attemptEvasion(player, opponent, combat, gameId);

                expect(result).toBe(false);
                expect(server.to).toHaveBeenCalledWith(combat.id);
                expect(journalService.logMessage).toHaveBeenCalledWith(combat.id, `Tentative d'évasion par ${player.name}: non réussie.`, [
                    player.name,
                ]);
            });
        });

        describe('getPlayersInArea', () => {
            it('should return players in the specified area', () => {
                const area: Coordinate[] = [{ x: 1, y: 1 }];
                const activePlayer: Player = { position: { x: 0, y: 0 } } as Player;
                const players: Player[] = [activePlayer, { position: { x: 1, y: 1 } } as Player, { position: { x: 2, y: 2 } } as Player];

                const result = service.getPlayersInArea(area, players, activePlayer);

                expect(result).toEqual([{ position: { x: 1, y: 1 } }]);
            });
        });

        describe('getItemsInArea', () => {
            it('should return items in the specified area', () => {
                const area: Coordinate[] = [{ x: 1, y: 1 }];
                const game: Game = {
                    items: [{ coordinate: { x: 1, y: 1 } } as Item, { coordinate: { x: 2, y: 2 } } as Item],
                } as Game;

                const result = service.getItemsInArea(area, game);

                expect(result).toEqual([{ coordinate: { x: 1, y: 1 } }]);
            });
        });

        describe('getAdjacentTiles', () => {
            it('should return adjacent tiles', () => {
                const position: Coordinate = { x: 1, y: 1 };

                const result = service.getAdjacentTiles(position);

                expect(result).toEqual([
                    { x: 2, y: 1 },
                    { x: 0, y: 1 },
                    { x: 1, y: 2 },
                    { x: 1, y: 0 },
                ]);
            });
        });

        describe('getAdjacentTilesToPossibleMoves', () => {
            it('should return adjacent tiles to possible moves', () => {
                const possibleMoves: [string, { path: Coordinate[]; weight: number }][] = [
                    ['move1', { path: [{ x: 1, y: 1 }], weight: 1 }],
                    ['move2', { path: [{ x: 2, y: 2 }], weight: 1 }],
                ];

                const result = service.getAdjacentTilesToPossibleMoves(possibleMoves);

                expect(result).toEqual([
                    { x: 2, y: 1 },
                    { x: 0, y: 1 },
                    { x: 1, y: 2 },
                    { x: 1, y: 0 },
                    { x: 3, y: 2 },
                    { x: 1, y: 2 },
                    { x: 2, y: 3 },
                    { x: 2, y: 1 },
                ]);
            });
        });

        describe('startCombatTurns', () => {
            it('should emit YourTurnCombat and PlayerTurnCombat events', () => {
                const gameId = 'gameId';
                const combat = {
                    currentTurnSocketId: 'challengerSocketId',
                    challenger: { socketId: 'challengerSocketId', specs: { evasions: 2 } },
                    opponent: { socketId: 'opponentSocketId', specs: { evasions: 2 } },
                } as Combat;
                const game: Game = { id: gameId } as Game;
                jest.spyOn(combatService, 'getCombatByGameId').mockReturnValue(combat);
                jest.spyOn(gameCreationService, 'getGameById').mockReturnValue(game);
                jest.spyOn(server, 'to').mockReturnValue({ emit: jest.fn() } as any);
                jest.spyOn(combatCountdownService, 'startTurnCounter').mockImplementation();

                service.startCombatTurns(gameId);

                expect(server.to).toHaveBeenCalledWith(combat.currentTurnSocketId);
                expect(server.to).toHaveBeenCalledWith(combat.opponent.socketId);
                expect(combatCountdownService.startTurnCounter).toHaveBeenCalledWith(game, true);
            });
        });

        describe('calculateVirtualPlayerPath', () => {
            it('should return a random path from possible moves', () => {
                const player: Player = {} as Player;
                const game: Game = { id: 'gameId' } as Game;
                const possibleMoves: [string, { path: Coordinate[]; weight: number }][] = [
                    ['move1', { path: [{ x: 1, y: 1 }], weight: 1 }],
                    ['move2', { path: [{ x: 2, y: 2 }], weight: 1 }],
                ];
                jest.spyOn(gameManagerService, 'getMoves').mockReturnValue(possibleMoves);
                jest.spyOn(Math, 'random').mockReturnValue(0.5);

                const result = service.calculateVirtualPlayerPath(player, game);

                expect(result).toEqual([{ x: 2, y: 2 }]);
            });
        });

        describe('updateVirtualPlayerPosition', () => {
            it('should return false if player is not found', async () => {
                const player: Player = null;
                const gameId = 'gameId';
                jest.spyOn(gameCreationService, 'getGameById').mockReturnValue({ id: gameId } as Game);

                const result = await service.updateVirtualPlayerPosition(player, gameId);

                expect(result).toBe(undefined);
            });
        });

        describe('updatePosition', () => {
            it('should emit GameFinishedPlayerWon event if player wins', async () => {
                const player: Player = { socketId: 'socketId', position: { x: 0, y: 0 } } as Player;
                const path: Coordinate[] = [{ x: 1, y: 1 }];
                const gameId = 'gameId';
                const game: Game = { id: gameId } as Game;
                jest.spyOn(gameCreationService, 'getGameById').mockReturnValue(game);
                jest.spyOn(gameManagerService, 'updatePosition').mockImplementation();
                jest.spyOn(gameManagerService, 'checkForWinnerCtf').mockReturnValue(true);
                jest.spyOn(server, 'to').mockReturnValue({ emit: jest.fn() } as any);

                await service.updatePosition(player, path, gameId, false);

                expect(server.to).toHaveBeenCalledWith(game.id);
                expect(server.to(game.id).emit).toHaveBeenCalledWith(CombatEvents.GameFinishedPlayerWon, player);
            });
        });

        describe('startCombat', () => {
            it('should return false if opponent socket is not found', async () => {
                const combat = {
                    id: 'combatId',
                    challenger: { name: 'challenger', socketId: 'challengerSocketId' },
                    opponent: { name: 'opponent', socketId: 'opponentSocketId' },
                } as Combat;
                const game: Game = { id: 'gameId' } as Game;
                jest.spyOn(server, 'in').mockReturnValue({
                    fetchSockets: jest.fn().mockResolvedValue([]),
                } as any);

                const result = await service.startCombat(combat, game);

                expect(result).toBe(false);
            });
        });

        describe('handleVirtualPlayerCombat', () => {
            it('should return undefined for non-virtual player', () => {
                const player: Player = { socketId: 'real1', profile: ProfileType.AGGRESSIVE } as Player;
                const opponent: Player = {} as Player;
                const gameId = 'gameId';
                const combat: Combat = {} as Combat;

                const result = service.handleVirtualPlayerCombat(player, opponent, gameId, combat);

                expect(result).toBeUndefined();
            });
        });

        describe('attemptEvasion', () => {
            it('should not update players in game if evasion fails', () => {
                const player: Player = { name: 'player' } as Player;
                const opponent: Player = { name: 'opponent' } as Player;
                const combat: Combat = { id: 'combatId' } as Combat;
                const gameId = 'gameId';
                jest.spyOn(Math, 'random').mockReturnValue(0.5);
                jest.spyOn(server, 'to').mockReturnValue({ emit: jest.fn() } as any);
                jest.spyOn(journalService, 'logMessage').mockImplementation();
                jest.spyOn(combatService, 'updatePlayersInGame').mockImplementation();

                const result = service.attemptEvasion(player, opponent, combat, gameId);

                expect(result).toBe(false);
                expect(combatService.updatePlayersInGame).not.toHaveBeenCalled();
            });
        });
    });
});
