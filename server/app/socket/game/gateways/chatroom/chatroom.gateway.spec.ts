import { ChatroomService } from '@app/socket/game/service/chatroom/chatroom.service';
import { Message } from '@common/message';
import { Test, TestingModule } from '@nestjs/testing';
import * as sinon from 'sinon';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { ChatRoomGateway } from './chatroom.gateway';

describe('ChatRoomGateway', () => {
    let gateway: ChatRoomGateway;
    let chatroomService: SinonStubbedInstance<ChatroomService>;
    let socket: SinonStubbedInstance<Socket>;
    let serverStub: SinonStubbedInstance<Server>;

    beforeEach(async () => {
        chatroomService = createStubInstance<ChatroomService>(ChatroomService);
        socket = createStubInstance<Socket>(Socket);
        serverStub = createStubInstance<Server>(Server);

        const module: TestingModule = await Test.createTestingModule({
            providers: [ChatRoomGateway, { provide: ChatroomService, useValue: chatroomService }],
        }).compile();

        gateway = module.get<ChatRoomGateway>(ChatRoomGateway);
        gateway['server'] = serverStub;
        serverStub.to.returns({
            emit: stub(),
            to: stub(),
        } as any);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should add user to room', () => {
        const roomId = '1234';
        const existingMessages: Message[] = [{ text: 'Hello', author: 'user1', timestamp: new Date(), gameId: '1234' }];
        chatroomService.getMessages.withArgs(roomId).returns(existingMessages);

        gateway.handleJoinRoom(roomId, socket);

        expect(socket.join.calledWith('1234')).toBeTruthy();
        expect(socket.emit.calledWith('previousMessages', existingMessages)).toBeTruthy();
    });

    it('should broadcast message to the room', () => {
        const roomName = 'room1';
        const message: Message = { text: 'Hello', author: 'user1', timestamp: new Date(), gameId: '1234' };
        const data = { roomName, message };

        chatroomService.addMessage.returns();

        gateway.handleMessage(socket, data);

        expect(chatroomService.addMessage.calledWith(roomName, message)).toBeTruthy();
        expect(serverStub.to.calledWith(roomName)).toBeTruthy();
    });

    it('should handle connection', () => {
        const consoleSpy = sinon.spy(console, 'log');
        gateway.handleConnection(socket);

        expect(consoleSpy.calledOnceWith(`Connexion par l'utilisateur avec id : ${socket.id}`)).toBeTruthy();
        consoleSpy.restore();
    });

    it('should handle disconnect', () => {
        const consoleSpy = sinon.spy(console, 'log');
        gateway.handleDisconnect(socket);

        expect(consoleSpy.calledOnceWith(`Déconnexion par l'utilisateur avec id : ${socket.id}`)).toBeTruthy();
        consoleSpy.restore();
    });
});
