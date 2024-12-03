import { ChatroomService } from '@app/services/chatroom/chatroom.service';
import { ChatEvents } from '@common/events/chat.events';
import { Message } from '@common/message';
import { Inject } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class ChatRoomGateway {
    @WebSocketServer() server: Server;

    @Inject(ChatroomService) private readonly chatroomService: ChatroomService;

    @SubscribeMessage(ChatEvents.JoinChatRoom)
    handleJoinRoom(client: Socket, roomId: string) {
        client.join(roomId);
        const existingMessages = this.chatroomService.getMessages(roomId);
        this.server.to(roomId).emit(ChatEvents.PreviousMessages, existingMessages);
    }

    @SubscribeMessage(ChatEvents.Message)
    handleMessage(client: Socket, data: { roomName: string; message: Message }) {
        this.chatroomService.addMessage(data.roomName, data.message);
        this.server.to(data.roomName).emit(ChatEvents.NewMessage, data.message);
    }
}
