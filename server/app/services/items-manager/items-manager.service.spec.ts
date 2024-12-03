import { ProfileType } from '@common/constants';
import { Avatar, Bonus, Game, Player, Specs } from '@common/game';
import { Coordinate, ItemCategory, Mode } from '@common/map.types';
import { Test, TestingModule } from '@nestjs/testing';
import { GameCreationService } from '../game-creation/game-creation.service';
import { GameManagerService } from '../game-manager/game-manager.service';
import { JournalService } from '../journal/journal.service';
import { ItemsManagerService } from './items-manager.service';

let specs: Specs = {
    life: 10,
    speed: 10,
    attack: 15,
    defense: 5,
    attackBonus: Bonus.D4,
    defenseBonus: Bonus.D6,
    movePoints: 10,
    actions: 2,
    evasions: 2,
    nVictories: 0,
    nDefeats: 0,
    nCombats: 0,
    nEvasions: 0,
    nLifeTaken: 0,
    nLifeLost: 0,
    nItemsUsed: 0,
};

let player: Player = {
    socketId: 'player-1',
    name: 'Player 1',
    avatar: Avatar.Avatar1,
    isActive: true,
    position: { x: 0, y: 0 },
    initialPosition: { x: 0, y: 0 },
    specs,
    inventory: [],
    turn: 0,
    visitedTiles: [],
    profile: ProfileType.NORMAL,
};

let game2: Game = {
    hasStarted: true,
    id: 'game-1',
    hostSocketId: 'host-1',
    name: 'Test Game Moves',
    description: 'A test game',
    imagePreview: 'some-image-url',
    mapSize: { x: 10, y: 10 },
    tiles: [],
    doorTiles: [{ coordinate: { x: 6, y: 6 }, isOpened: false }],
    items: [],
    players: [player],
    currentTurn: 0,
    nTurns: 0,
    nDoorsManipulated: [],
    duration: 0,
    debug: false,
    mode: Mode.Classic,
    startTiles: [{ coordinate: { x: 1, y: 1 } }, { coordinate: { x: 19, y: 19 } }],
    isLocked: false,
};

describe('ItemsManagerService', () => {
    let service: ItemsManagerService;
    let gameCreationService: GameCreationService;
    let gameManagerService: GameManagerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ItemsManagerService,
                {
                    provide: GameCreationService,
                    useValue: {
                        getGameById: jest.fn(),
                    },
                },
                {
                    provide: GameManagerService,
                    useValue: {
                        getFirstFreePosition: jest.fn(),
                    },
                },
                {
                    provide: JournalService,
                    useValue: {
                        logMessage: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ItemsManagerService>(ItemsManagerService);
        gameCreationService = module.get<GameCreationService>(GameCreationService);
        gameManagerService = module.get<GameManagerService>(GameManagerService);

        player.inventory = [];
        game2.items = [];
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('dropInventory', () => {
        it('should drop all items from player inventory to the game', () => {
            const gameId = 'game-1';
            const player = game2.players[0];
            player.inventory.push(ItemCategory.Sword, ItemCategory.Armor);
            jest.spyOn(gameCreationService, 'getGameById').mockReturnValue(game2);
            jest.spyOn(gameManagerService, 'getFirstFreePosition').mockReturnValue({ x: 1, y: 1 });

            service.dropInventory(player, gameId);

            expect(game2.items).toContainEqual({ coordinate: player.position, category: ItemCategory.Sword });
            expect(game2.items).toContainEqual({ coordinate: { x: 1, y: 1 }, category: ItemCategory.Armor });
            expect(player.inventory).toHaveLength(0);
        });

        it('should not drop items if game is not found', () => {
            const gameId = 'invalid-game-id';
            const player = game2.players[0];
            player.inventory.push(ItemCategory.Sword, ItemCategory.Armor);
            jest.spyOn(gameCreationService, 'getGameById').mockReturnValue(undefined);

            service.dropInventory(player, gameId);

            expect(game2.items).toHaveLength(0);
            expect(player.inventory).toHaveLength(2);
        });

        it('should drop items to the first available tile if player position is occupied', () => {
            const gameId = 'game-1';
            const player = game2.players[0];
            player.inventory.push(ItemCategory.Sword, ItemCategory.Armor);
            jest.spyOn(gameCreationService, 'getGameById').mockReturnValue(game2);
            jest.spyOn(gameManagerService, 'getFirstFreePosition').mockReturnValue({ x: 2, y: 2 });

            service.dropInventory(player, gameId);

            expect(game2.items).toContainEqual({ coordinate: player.position, category: ItemCategory.Sword });
            expect(game2.items).toContainEqual({ coordinate: { x: 2, y: 2 }, category: ItemCategory.Armor });
            expect(player.inventory).toHaveLength(0);
        });
    });

    describe('pickUpItem', () => {
        it('should pick up an item and add it to player inventory', () => {
            const gameId = 'game-1';
            const player = game2.players[0];
            game2.items.push({ coordinate: { x: 0, y: 0 }, category: ItemCategory.Sword });
            jest.spyOn(gameCreationService, 'getGameById').mockReturnValue(game2);

            service.pickUpItem({ x: 0, y: 0 }, gameId, player);

            expect(player.inventory).toContain(ItemCategory.Sword);
            expect(game2.items).toHaveLength(0);
        });
    });

    describe('dropItem', () => {
        it('should drop an item from player inventory to the game', () => {
            const coordinates: Coordinate = { x: 2, y: 2 };
            player.inventory.push(ItemCategory.Sword);
            jest.spyOn(gameCreationService, 'getGameById').mockReturnValue(game2);

            service.dropItem(ItemCategory.Sword, game2.id, player, coordinates);

            expect(game2.items).toContainEqual({ coordinate: coordinates, category: ItemCategory.Sword });
            expect(player.inventory).not.toContain(ItemCategory.Sword);
        });
    });

    describe('onItem', () => {
        it('should return true if player is on an item', () => {
            const gameId = 'game-1';
            game2.items.push({ coordinate: { x: 0, y: 0 }, category: ItemCategory.Sword });
            jest.spyOn(gameCreationService, 'getGameById').mockReturnValue(game2);

            const result = service.onItem(player, gameId);

            expect(result).toBe(true);
        });
    });
    describe('activateItem', () => {
        it('should increase player speed and attack when activating a sword', () => {
            const initialSpeed = player.specs.speed;
            const initialAttack = player.specs.attack;

            service.activateItem(ItemCategory.Sword, player);

            expect(player.specs.speed).toBe(initialSpeed + 1);
            expect(player.specs.attack).toBe(initialAttack + 2);
        });

        it('should increase player defense and decrease speed when activating armor', () => {
            const initialDefense = player.specs.defense;
            const initialSpeed = player.specs.speed;

            service.activateItem(ItemCategory.Armor, player);

            expect(player.specs.defense).toBe(initialDefense + 2);
            expect(player.specs.speed).toBe(initialSpeed - 1);
        });

        it('should increase player attack when activating a flask', () => {
            const initialAttack = player.specs.attack;

            service.activateItem(ItemCategory.Flask, player);

            expect(player.specs.attack).toBe(initialAttack + 2);
        });
    });
    describe('desactivateItem', () => {
        it('should decrease player speed and attack when deactivating a sword', () => {
            player.specs.speed += 2;
            player.specs.attack += 4;

            service.desactivateItem(ItemCategory.Sword, player);

            expect(player.specs.speed).toBe(specs.speed);
            expect(player.specs.attack).toBe(specs.attack);
        });

        it('should decrease player defense and increase speed when deactivating armor', () => {
            player.specs.defense += 5;
            player.specs.speed -= 1;

            service.desactivateItem(ItemCategory.Armor, player);

            expect(player.specs.defense).toBe(specs.defense);
            expect(player.specs.speed).toBe(specs.speed);
        });

        it('should decrease player attack when deactivating a flask', () => {
            player.specs.attack += 4;

            service.desactivateItem(ItemCategory.Flask, player);

            expect(player.specs.attack).toBe(specs.attack);
        });

        it('should decrease player attack when deactivating an amulet', () => {
            player.specs.life += 4;

            service.desactivateItem(ItemCategory.Amulet, player);

            expect(player.specs.life).toBe(specs.life);
        });
    });
    describe('checkForAmulet', () => {
        it('should activate amulet for challenger if challenger has amulet and opponent has more life', () => {
            const challenger = { ...player, specs: { ...player.specs, life: 5 }, inventory: [ItemCategory.Amulet] };
            const opponent = { ...player, specs: { ...player.specs, life: 10 }, inventory: [] };
            jest.spyOn(service, 'activateItem');

            service.checkForAmulet(challenger, opponent);

            expect(service.activateItem).toHaveBeenCalledWith(ItemCategory.Amulet, challenger);
        });

        it('should activate amulet for opponnent if opponent has amulet and challenger has more life', () => {
            const challenger = { ...player, specs: { ...player.specs, life: 10 }, inventory: [] };
            const opponent = { ...player, specs: { ...player.specs, life: 5 }, inventory: [ItemCategory.Amulet] };
            jest.spyOn(service, 'activateItem');

            service.checkForAmulet(challenger, opponent);

            expect(service.activateItem).toHaveBeenCalledWith(ItemCategory.Amulet, opponent);
        });

        it('should not activate amulet if neither player has an amulet', () => {
            const challenger = { ...player, specs: { ...player.specs, life: 5 }, inventory: [] };
            const opponent = { ...player, specs: { ...player.specs, life: 10 }, inventory: [] };
            jest.spyOn(service, 'activateItem');

            service.checkForAmulet(challenger, opponent);

            expect(service.activateItem).not.toHaveBeenCalled();
        });

        it('should not activate amulet if both players have equal life', () => {
            const challenger = { ...player, specs: { ...player.specs, life: 10 }, inventory: [ItemCategory.Amulet] };
            const opponent = { ...player, specs: { ...player.specs, life: 10 }, inventory: [ItemCategory.Amulet] };
            jest.spyOn(service, 'activateItem');

            service.checkForAmulet(challenger, opponent);

            expect(service.activateItem).not.toHaveBeenCalled();
        });
    });
});
