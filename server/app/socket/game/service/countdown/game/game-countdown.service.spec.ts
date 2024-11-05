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
        service.initCountdown('test_id', 5);
        await service.startNewCountdown('test_id');

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
        service.initCountdown('test_id', 3);
        await service.startNewCountdown('test_id');

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
        expect(service.emit).toHaveBeenCalledWith('timeout', 'test_id');
    });

    it('should pause the countdown and emit pausedCountDown with remaining time', () => {
        service.initCountdown('test_id', 10);
        service.startNewCountdown('test_id');

        intervalCallback();
        intervalCallback();
        intervalCallback();
        intervalCallback();

        service.pauseCountdown('test_id');
        const countdown = service['countdowns'].get('test_id');
        expect(mockServer.emit).toHaveBeenCalledWith('pausedCountDown', countdown?.remaining);
    });

    it('should resume the countdown from the remaining time', () => {
        service.initCountdown('test_id', 10);
        service.startNewCountdown('test_id');

        intervalCallback();
        intervalCallback();
        intervalCallback();
        intervalCallback();

        intervalCallback();
        intervalCallback();
        service.pauseCountdown('test_id');
        mockServer.emit.mockClear();
        service.resumeCountdown('test_id');
        intervalCallback();
        expect(mockServer.emit).toHaveBeenCalledWith('secondPassed', 8);
    });

    it('should reset the countdown to the original duration and emit restartedCountDown', () => {
        service.initCountdown('test_id', 10);
        service.startNewCountdown('test_id');

        intervalCallback();
        intervalCallback();
        intervalCallback();
        intervalCallback();

        intervalCallback();
        intervalCallback();
        service.resetCountdown('test_id');

        const countdown = service['countdowns'].get('test_id');
        expect(countdown?.remaining).toBe(10);
    });

    it('should delete the countdown and unsubscribe from the timer when deleteCountdown is called', () => {
        service.initCountdown('test_id', 5);
        service.startNewCountdown('test_id');

        expect(service['countdowns'].has('test_id')).toBe(true);

        service.deleteCountdown('test_id');

        expect(service['countdowns'].has('test_id')).toBe(false);

        expect(mockIntervalSubscription.unsubscribe).toHaveBeenCalled();
    });
});
