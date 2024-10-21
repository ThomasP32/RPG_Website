import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    public socket: Socket;

    constructor() {}

    connect() {
        this.socket = io('http://localhost:3000/game', { transports: ['websocket'] });
    }

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    sendMessage<T>(event: string, data: T): void {
        console.log('sending message', event, data);
        this.socket.emit(event, data);
    }

    // listen(event: string, _callback: (data: { playerName: String; gameId: String }) => void): Observable<any> {
    //     return new Observable((subscriber) => {
    //         this.socket.on(event, (data) => {
    //             subscriber.next(data);
    //         });

    //         return () => {
    //             this.socket.off(event);
    //         };
    //     });
    // }

    listen<T>(event: string): Observable<T> {
        return new Observable((subscriber) => {
            this.socket.on(event, (data: T) => {
                subscriber.next(data);
            });

            return () => {
                this.socket.off(event);
            };
        });
    }

    disconnect(): void {
        this.socket.disconnect();
    }
}
