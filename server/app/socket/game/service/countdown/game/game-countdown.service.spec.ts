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

    beforeEach(() => {
        service = new GameCountdownService();
        mockServer = new Server() as jest.Mocked<Server>;
        service.setServer(mockServer);

        mockServer.to = jest.fn().mockReturnThis();
        mockServer.emit = jest.fn();

        mockIntervalSubscription = { unsubscribe: jest.fn() } as unknown as jest.Mocked<Subscription>;

        // Mock `interval` to capture the callback for manual control
        (interval as jest.Mock).mockImplementation(() => ({
            subscribe: jest.fn((callback: () => void) => {
                intervalCallback = callback;
                return mockIntervalSubscription;
            }),
        }));

        // Spy on the `emit` method to allow assertions
        jest.spyOn(service, 'emit');

        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    it('should start a new countdown with delay and emit startTurn at delay 0', async () => {
        service.initCountdown('test_id', 5);
        await service.startNewCountdown('test_id');

        // Simulate delay countdown: 3, 2, 1, 0
        intervalCallback(); // delay = 3
        expect(mockServer.emit).toHaveBeenCalledWith('delay', 3);

        intervalCallback(); // delay = 2
        expect(mockServer.emit).toHaveBeenCalledWith('delay', 2);

        intervalCallback(); // delay = 1
        expect(mockServer.emit).toHaveBeenCalledWith('delay', 1);

        intervalCallback(); // delay = 0, emit startTurn
        expect(mockServer.emit).toHaveBeenCalledWith('delay', 0);
        expect(mockServer.emit).toHaveBeenCalledWith('startTurn');

        mockServer.emit.mockClear();
    });

    it('should emit secondPassed events during countdown and emit timeout when reaching 0', async () => {
        service.initCountdown('test_id', 3);
        await service.startNewCountdown('test_id');

        // Complete delay phase
        intervalCallback(); // delay = 3
        intervalCallback(); // delay = 2
        intervalCallback(); // delay = 1
        intervalCallback(); // delay = 0, emit startTurn

        mockServer.emit.mockClear();

        // Simulate main countdown phase: 3, 2, 1, 0
        intervalCallback(); // remaining = 3
        expect(mockServer.emit).toHaveBeenCalledWith('secondPassed', 3);

        intervalCallback(); // remaining = 2
        expect(mockServer.emit).toHaveBeenCalledWith('secondPassed', 2);

        intervalCallback(); // remaining = 1
        expect(mockServer.emit).toHaveBeenCalledWith('secondPassed', 1);

        intervalCallback(); // remaining = 0, emit timeout
        expect(service.emit).toHaveBeenCalledWith('timeout', 'test_id');
    });

    it('should pause the countdown and emit pausedCountDown with remaining time', () => {
        service.initCountdown('test_id', 10);
        service.startNewCountdown('test_id');

        // Complete delay phase
        intervalCallback(); // delay = 3
        intervalCallback(); // delay = 2
        intervalCallback(); // delay = 1
        intervalCallback(); // delay = 0

        // Pause the countdown
        service.pauseCountdown('test_id');
        const countdown = service['countdowns'].get('test_id');
        expect(mockServer.emit).toHaveBeenCalledWith('pausedCountDown', countdown?.remaining);
    });

    it('should resume the countdown from the remaining time', () => {
        service.initCountdown('test_id', 10);
        service.startNewCountdown('test_id');

        // Complete delay phase and partial countdown phase
        intervalCallback(); // delay = 3
        intervalCallback(); // delay = 2
        intervalCallback(); // delay = 1
        intervalCallback(); // delay = 0

        // Main countdown phase starts
        intervalCallback(); // remaining = 10
        intervalCallback(); // remaining = 9
        service.pauseCountdown('test_id');
        mockServer.emit.mockClear();
        service.resumeCountdown('test_id');
        intervalCallback(); // should emit secondPassed for remaining = 8
        expect(mockServer.emit).toHaveBeenCalledWith('secondPassed', 8);
    });

    it('should reset the countdown to the original duration and emit restartedCountDown', () => {
        service.initCountdown('test_id', 10);
        service.startNewCountdown('test_id');

        // Complete delay phase
        intervalCallback(); // delay = 3
        intervalCallback(); // delay = 2
        intervalCallback(); // delay = 1
        intervalCallback(); // delay = 0

        // Partial main countdown
        intervalCallback(); // remaining = 10
        intervalCallback(); // remaining = 9
        service.resetCountdown('test_id');

        const countdown = service['countdowns'].get('test_id');
        expect(countdown?.remaining).toBe(10);
    });
});
