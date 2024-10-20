import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    public socket: Socket;
    private readonly socketUrl = 'http://localhost:3000/game';

    constructor() {}

    connect() {
        this.socket = io(this.socketUrl, { transports: ['websocket'] });
    }

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    sendMessage<T>(event: string, data: T): void {
        console.log('sending message', event, data);
        this.socket.emit(event, data);
    }

    listen<T>(event: string): Observable<T> {
        return new Observable<T>((subscriber) => {
            this.socket.on(event, (data: T) => {
                subscriber.next(data);
            });
        });
    }

    disconnect(): void {
        this.socket.disconnect();
    }
}
