import { Application } from '@app/app';
import { Server } from 'app/server';
import { assert, expect } from 'chai';
import sinon from 'sinon';
import { io as ioClient, Socket } from 'socket.io-client';
import { Container } from 'typedi';
import { SocketManager } from './socketManager.service';

const RESPONSE_DELAY = 200;
describe('SocketManager service tests', () => {
    let service: SocketManager;
    let server: Server;
    let clientSocket: Socket;

    const urlString = 'http://localhost:5020';

    beforeEach(async () => {
        const app = Container.get(Application);
        server = new Server(app);
        server.init();
        service = server['socketManager'];
        clientSocket = ioClient(urlString);
        sinon.stub(console, 'log'); //stop console.log
    });

    afterEach(() => {
        clientSocket.close();
        service['sio'].close();
        sinon.restore();
    });

    it('should add the socket to the room after a join event', (done) => {
        clientSocket.emit('joinRoom');
        setTimeout(() => {
            const newRoomSize = service['sio'].sockets.adapter.rooms.get(service['room'])?.size;
            expect(newRoomSize).to.equal(1);
            done();
        }, RESPONSE_DELAY);
    });

    it('should not broadcast message to room if origin socket is not in room', (done) => {
        const testMessage = 'Hello World';
        const spy = sinon.spy(service['sio'], 'to');
        clientSocket.emit('roomMessage', testMessage);

        setTimeout(() => {
            assert(spy.notCalled);
            done();
        }, RESPONSE_DELAY);
    });

    it('should broadcast message to room if origin socket is in room', (done) => {
        const testMessage = 'Hello World';
        clientSocket.emit('joinRoom');
        clientSocket.emit('roomMessage', testMessage);

        clientSocket.on('roomMessage', (message: string) => {
            expect(message).to.contain(testMessage);
            done();
        });
    });

    it('should broadcast message to multiple clients on broadcastAll event', (done) => {
        const clientSocket2 = ioClient(urlString);
        const testMessage = 'Hello World';
        const spy = sinon.spy(service['sio'].sockets, 'emit');
        clientSocket.emit('broadcastAll', testMessage);

        clientSocket2.on('massMessage', (message: string) => {
            expect(message).to.contain(testMessage);
            assert(spy.called);
            done();
        });
    });
});
