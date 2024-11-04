import { CombatCountdownService } from './combat-countdown.service';
import { Server } from 'socket.io';
import { interval, Subscription } from 'rxjs';

jest.mock('socket.io');
jest.mock('rxjs', () => ({
    interval: jest.fn(),
}));

describe('CombatCountdownService', () => {
    let service: CombatCountdownService;
    let mockServer: jest.Mocked<Server>;
    let mockIntervalSubscription: jest.Mocked<Subscription>;
    let intervalCallback: () => void;

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
        await service.startTurnCounter('test_id', true);

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
        expect(service.emit).toHaveBeenCalledWith('timeout', 'test_id');
        expect(mockServer.emit).toHaveBeenCalledWith('endCombatTurn');
    });

    it('should start a new countdown with 3 seconds if evasions are not enabled', async () => {
        service.initCountdown('test_id', 3);
        await service.startTurnCounter('test_id', false);

        intervalCallback(); // Emit combatSecondPassed for remaining = 3
        expect(mockServer.emit).toHaveBeenCalledWith('combatSecondPassed', 3);

        intervalCallback(); // remaining = 2
        expect(mockServer.emit).toHaveBeenCalledWith('combatSecondPassed', 2);

        intervalCallback(); // remaining = 1
        expect(mockServer.emit).toHaveBeenCalledWith('combatSecondPassed', 1);

        intervalCallback(); // remaining = 0, emit endCombatTurn and timeout
        expect(service.emit).toHaveBeenCalledWith('timeout', 'test_id');
        expect(mockServer.emit).toHaveBeenCalledWith('endCombatTurn');
    });

    it('should reset the timer subscription when resetTimerSubscription is called', () => {
        service.initCountdown('test_id', 10);
        service.startTurnCounter('test_id', false);

        service.resetTimerSubscription('test_id');
        expect(mockIntervalSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should reset the countdown to the original duration without emitting events', () => {
        service.initCountdown('test_id', 5);
        service.startTurnCounter('test_id', false);

        intervalCallback(); 
        intervalCallback(); 
        intervalCallback();

        mockServer.emit.mockClear(); 

        service.resetCountdown('test_id'); 

        const countdown = service['countdowns'].get('test_id');
        expect(countdown?.remaining).toBe(3);
        service.startTurnCounter('test_id',true);
        expect(countdown?.remaining).toBe(5);
    });
});
