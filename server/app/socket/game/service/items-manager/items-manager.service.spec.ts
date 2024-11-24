import { Avatar, Bonus, Game, Player, Specs } from '@common/game';
import { Coordinate, ItemCategory, Mode } from '@common/map.types';
import { Test, TestingModule } from '@nestjs/testing';
import { GameCreationService } from '../game-creation/game-creation.service';
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
    nDoorsManipulated: 0,
    duration: 0,
    debug: false,
    mode: Mode.Classic,
    startTiles: [{ coordinate: { x: 1, y: 1 } }, { coordinate: { x: 19, y: 19 } }],
    isLocked: false,
};

describe('ItemsManagerService', () => {
    let service: ItemsManagerService;
    let gameCreationService: GameCreationService;

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
            ],
        }).compile();

        service = module.get<ItemsManagerService>(ItemsManagerService);
        gameCreationService = module.get<GameCreationService>(GameCreationService);

        player.inventory = [];
        game2.items = [];
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
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
});
