import { Message } from '@common/message';
import { Injectable } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class ChatRoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    @SubscribeMessage('joinRoom')
    handleJoinRoom(client: Socket, gameId: string): void {
        client.join(gameId);
        console.log(`Client ${client.id} joined room ${gameId}`);
    }

    @SubscribeMessage('sendMessage')
    handleMessage(socket: Socket, message: Message) {
        // Seulement un membre de la salle peut envoyer un message aux autres
        if (socket.rooms.has(message.gameId)) {
            this.server.to(message.gameId).emit('roomMessage', `${socket.id} : ${message}`);
        }
    }

    afterInit() {
        console.log('ChatRoomGateway initialized');
    }

    handleConnection(socket: Socket) {
        console.log(`Connexion par l'utilisateur avec id : ${socket.id}`);
    }

    handleDisconnect(socket: Socket) {
        console.log(`Déconnexion par l'utilisateur avec id : ${socket.id}`);
    }
}
