import { TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Socket } from 'socket.io-client';

describe('SocketService', () => {
    let service: SocketService;
    let mockSocket: jasmine.SpyObj<Socket>;

    beforeEach(() => {
        mockSocket = jasmine.createSpyObj('Socket', ['emit', 'on', 'disconnect', 'connect']);

        TestBed.configureTestingModule({
            providers: [SocketService, { provide: Socket, useValue: mockSocket }],
        });

        service = TestBed.inject(SocketService);
        service['socket'] = mockSocket;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return true when socket is alive', () => {
        mockSocket.connected = true;
        expect(service.isSocketAlive()).toBeTrue();
    });

    it('should return false when socket is not connected', () => {
        mockSocket.connected = false;
        expect(service.isSocketAlive()).toBeFalse();
    });

    it('should listen for an event', (done) => {
        const event = 'testEvent';
        const mockData = { message: 'Hello' };

        /* The data parameter is included to match the expected callback signature of 
        (data: any) => void for compatibility with the real socket.on method.
        It is not used because the test relies on predefined mockData to ensure controlled behavior.*/
        /* eslint-disable no-unused-vars */
        mockSocket.on.and.callFake((eventName: string, callback: (data: any) => void) => {
            if (eventName === event) {
                callback(mockData);
            }
            return mockSocket;
        });

        service.listen(event).subscribe((data: any) => {
            expect(data).toEqual(mockData);
            done();
        });

        expect(mockSocket.on).toHaveBeenCalledWith(event, jasmine.any(Function));
    });

    it('should send a message via socket', () => {
        const event = 'testEvent';
        const data = { message: 'Hello' };

        service.sendMessage(event, data);

        expect(mockSocket.emit).toHaveBeenCalledWith(event, data);
    });

    it('should disconnect the socket', () => {
        service.disconnect();
        expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should connect the socket', () => {
        service.connect();
        expect(mockSocket.connect).toHaveBeenCalled();
    });
});
