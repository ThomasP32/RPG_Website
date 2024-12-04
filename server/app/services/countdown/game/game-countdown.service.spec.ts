import { ProfileType } from '@common/constants';
import { Avatar, Bonus, Game, Player } from '@common/game';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { interval, Subscription } from 'rxjs';
import { Server } from 'socket.io';
import { GameCountdownService } from './game-countdown.service';

jest.mock('socket.io');
jest.mock('rxjs', () => ({
    interval: jest.fn(),
}));

describe('GameCountdownService', () => {
    let service: GameCountdownService;
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
        service = new GameCountdownService();
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

    it('should start a new countdown with delay and emit startTurn at delay 0', async () => {
        service.initCountdown(mockGame.id, 5);
        await service.startNewCountdown(mockGame);

        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('delay', 3);

        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('delay', 2);

        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('delay', 1);

        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('delay', 0);
        expect(mockServer.emit).toHaveBeenCalledWith('startTurn');

        mockServer.emit.mockClear();
    });

    it('should emit secondPassed events during countdown and emit timeout when reaching 0', async () => {
        service.initCountdown(mockGame.id, 3);
        await service.startNewCountdown(mockGame);

        intervalCallback();
        intervalCallback();
        intervalCallback();
        intervalCallback();

        mockServer.emit.mockClear();

        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('secondPassed', 3);

        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('secondPassed', 2);

        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('secondPassed', 1);

        intervalCallback();
        expect(service.emit).toHaveBeenCalledWith('timeout', mockGame.id);
    });

    it('should pause the countdown and emit pausedCountDown with remaining time', () => {
        service.initCountdown(mockGame.id, 10);
        service.startNewCountdown(mockGame);

        intervalCallback();
        intervalCallback();
        intervalCallback();
        intervalCallback();

        service.pauseCountdown(mockGame.id);
        const countdown = service['countdowns'].get(mockGame.id);
        expect(mockServer.emit).toHaveBeenCalledWith('pausedCountDown', countdown?.remaining);
    });

    it('should resume the countdown from the remaining time', () => {
        service.initCountdown(mockGame.id, 10);
        service.startNewCountdown(mockGame);

        intervalCallback();
        intervalCallback();
        intervalCallback();
        intervalCallback();

        intervalCallback();
        intervalCallback();
        service.pauseCountdown(mockGame.id);
        mockServer.emit.mockClear();
        service.resumeCountdown(mockGame.id);
        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('secondPassed', 8);
    });

    it('should reset the countdown to the original duration and emit restartedCountDown', () => {
        service.initCountdown(mockGame.id, 10);
        service.startNewCountdown(mockGame);

        intervalCallback();
        intervalCallback();
        intervalCallback();
        intervalCallback();

        intervalCallback();
        intervalCallback();
        service.resetCountdown(mockGame.id);

        const countdown = service['countdowns'].get(mockGame.id);
        expect(countdown?.remaining).toBe(10);
    });

    it('should delete the countdown and unsubscribe from the timer when deleteCountdown is called', () => {
        service.initCountdown(mockGame.id, 5);
        service.startNewCountdown(mockGame);

        expect(service['countdowns'].has(mockGame.id)).toBe(true);

        service.deleteCountdown(mockGame.id);

        expect(service['countdowns'].has(mockGame.id)).toBe(false);

        expect(mockIntervalSubscription.unsubscribe).toHaveBeenCalled();
    });
});
