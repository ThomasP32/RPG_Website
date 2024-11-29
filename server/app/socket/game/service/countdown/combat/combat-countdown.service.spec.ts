import { ProfileType } from '@common/constants';
import { Avatar, Bonus, Game, Player } from '@common/game';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { interval, Subscription } from 'rxjs';
import { Server } from 'socket.io';
import { CombatCountdownService } from './combat-countdown.service';

jest.mock('socket.io');
jest.mock('rxjs', () => ({
    interval: jest.fn(),
}));

describe('CombatCountdownService', () => {
    let service: CombatCountdownService;
    let mockServer: jest.Mocked<Server>;
    let mockIntervalSubscription: jest.Mocked<Subscription>;
    let intervalCallback: () => void;

    const mockPlayer: Player = {
        socketId: 'test-socket',
        name: 'Test Player',
        avatar: Avatar.Avatar1,
        isActive: true,
        position: { x: 0, y: 0 },
        initialPosition: { x: 0, y: 0 },
        specs: {
            evasions: 2,
            life: 100,
            speed: 10,
            attack: 10,
            defense: 10,
            movePoints: 5,
            actions: 2,
            attackBonus: Bonus.D4,
            defenseBonus: Bonus.D6,
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
            nEvasions: 0,
            nLifeTaken: 0,
            nLifeLost: 0,
            nItemsUsed: 0,
        },
        inventory: [],
        turn: 0,
        visitedTiles: [],
        profile: ProfileType.NORMAL,
    };

    const mockGame: Game = {
        id: 'test-id',
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
        players: [mockPlayer],
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

    beforeEach(() => {
        service = new CombatCountdownService();
        mockServer = new Server() as jest.Mocked<Server>;
        service.setServer(mockServer);

        mockServer.to = jest.fn().mockReturnThis();
        mockServer.emit = jest.fn();

        mockIntervalSubscription = { unsubscribe: jest.fn() } as unknown as jest.Mocked<Subscription>;

        (interval as jest.Mock).mockImplementation(() => ({
            subscribe: jest.fn((callback: () => void) => {
                intervalCallback = callback;
                return mockIntervalSubscription;
            }),
        }));

        jest.spyOn(service, 'emit');

        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    it('should initialize a countdown with correct duration if not present', () => {
        service.initCountdown('test_id', 5);
        const countdown = service['countdowns'].get('test_id');
        expect(countdown).toEqual({ duration: 5, remaining: 5 });
    });

    it('should start a new countdown with 5 seconds if evasions are enabled', async () => {
        service.initCountdown('test_id', 5);
        await service.startTurnCounter(mockGame, true);

        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('combatSecondPassed', 5);

        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('combatSecondPassed', 4);

        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('combatSecondPassed', 3);

        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('combatSecondPassed', 2);

        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('combatSecondPassed', 1);

        intervalCallback();
        expect(service.emit).toHaveBeenCalledWith('timeout', 'test-id');
    });

    it('should start a new countdown with 3 seconds if evasions are not enabled', async () => {
        service.initCountdown('test-id', 3);
        await service.startTurnCounter(mockGame, false);

        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('combatSecondPassed', 3);

        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('combatSecondPassed', 2);

        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('combatSecondPassed', 1);

        intervalCallback();
        expect(service.emit).toHaveBeenCalledWith('timeout', 'test-id');
    });

    it('should reset the timer subscription when resetTimerSubscription is called', () => {
        service.initCountdown('test-id', 10);
        service.startTurnCounter(mockGame, false);

        service.resetTimerSubscription('test-id');
        expect(mockIntervalSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should delete the countdown and unsubscribe from the timer when deleteCountdown is called', () => {
        service.initCountdown('test-id', 5);
        service.startTurnCounter(mockGame, true);

        service.deleteCountdown('test-id');

        expect(service['countdowns'].has('test-id')).toBe(false);

        expect(mockIntervalSubscription.unsubscribe).toHaveBeenCalled();
    });
});
