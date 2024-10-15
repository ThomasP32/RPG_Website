import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    private socket: Socket;

    constructor() {
        this.socket = io('http://localhost:3000/game', { transports: ['websocket'] });
    }

    sendMessage<T>(event: string, data: T): void {
        console.log('sending message');
        this.socket.emit(event, data);
    }

    listen(event: string) {
        return new Observable((subscriber) => {
            this.socket.on(event, (data) => {
                subscriber.next(data);
            });
        });
    }

    disconnect(): void {
        this.socket.disconnect();
    }
}
