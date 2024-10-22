import { ChatroomService } from '@app/socket/game/service/chatroom/chatroom.service';
import { Message } from '@common/message';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class ChatRoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(private readonly chatroomService: ChatroomService) {}

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@MessageBody() roomId: string, @ConnectedSocket() socket: Socket) {
        socket.join(roomId);
        const existingMessages = this.chatroomService.getMessages(roomId);
        socket.emit('previousMessages', existingMessages);
    }

    @SubscribeMessage('message')
    handleMessage(@ConnectedSocket() socket: Socket, @MessageBody() data: { roomName: string; message: Message }) {
        const { roomName, message } = data;
        this.chatroomService.addMessage(roomName, message);
        this.server.to(roomName).emit('message', message);
    }

    handleConnection(socket: Socket) {
        console.log(`Connexion par l'utilisateur avec id : ${socket.id}`);
    }

    handleDisconnect(socket: Socket) {
        console.log(`Déconnexion par l'utilisateur avec id : ${socket.id}`);
    }
}
