import * as http from 'http';
import * as io from 'socket.io';

export class SocketManager {
    private sio: io.Server;
    private room: string = 'serverRoom';
    constructor(server: http.Server) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
    }

    public handleSockets(): void {
        this.sio.on('connection', (socket) => {
            console.log(`Connexion par l'utilisateur avec id : ${socket.id}`);

            socket.on('joinRoom', (gameId: string) => {
                socket.join(gameId);
                console.log(`User ${socket.id} joined room: ${gameId}`);
                socket.to(gameId).emit('userJoined', `${socket.id} has joined the room`);
            });

            socket.on('roomMessage', (gameId: string, message: string) => {
                if (socket.rooms.has(this.room)) {
                    this.sio.to(gameId).emit('roomMessage', { author: socket.id, text: message, timestamp: new Date() });
                }
            });

            socket.on('disconnect', (reason) => {
                console.log(`User ${socket.id} disconnected. Reason: ${reason}`);
            });
        });
    }
}
