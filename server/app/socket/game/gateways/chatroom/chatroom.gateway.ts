import { ChatroomService } from '@app/socket/game/service/chatroom/chatroom.service';
import { Message } from '@common/message';
import { Inject } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class ChatRoomGateway {
    @WebSocketServer() server: Server;

    @Inject(ChatroomService) private chatroomService: ChatroomService;

    @SubscribeMessage('joinChatRoom')
    handleJoinRoom(client: Socket, roomId: string) {
        client.join(roomId);
        const existingMessages = this.chatroomService.getMessages(roomId);
        this.server.to(roomId).emit('previousMessages', existingMessages);
    }

    @SubscribeMessage('message')
    handleMessage(client: Socket, data: { roomName: string; message: Message }) {
    
        this.chatroomService.addMessage(data.roomName, data.message);
        this.server.to(data.roomName).emit('message', data.message);
    }
}
