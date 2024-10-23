import { Message } from '@common/message';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatroomService } from './chatroom.service';

describe('ChatroomService', () => {
    let service: ChatroomService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ChatroomService],
        }).compile();

        service = module.get<ChatroomService>(ChatroomService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should add a message to a new room', () => {
        const roomId = 'room1';
        const message: Message = { text: 'Hello', author: 'user1', timestamp: new Date(), gameId: '1234' };

        service.addMessage(roomId, message);

        expect(service.getMessages(roomId)).toEqual([message]);
    });

    it('should add a message to an existing room', () => {
        const roomId = 'room1';
        const message1: Message = { text: 'Hello', author: 'user1', timestamp: new Date(), gameId: '1234' };
        const message2: Message = { text: 'Hey', author: 'user2', timestamp: new Date(), gameId: '1234' };

        service.addMessage(roomId, message1);
        service.addMessage(roomId, message2);

        expect(service.getMessages(roomId)).toEqual([message1, message2]);
    });

    it('should return an empty array if no messages exist for a room', () => {
        const roomId = 'room2';

        expect(service.getMessages(roomId)).toEqual([]);
    });
});
