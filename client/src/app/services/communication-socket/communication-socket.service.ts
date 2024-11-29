import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    public socket: Socket;

    constructor() {
        this.connect();
    }

    connect() {
        if (!this.socket) {
            this.socket = io(environment.socketUrl, { transports: ['websocket'] });
        }
        this.socket.connect();
    }

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    sendMessage<T>(event: string, data?: T): void {
        this.socket.emit(event, data);
    }

    listen<T>(eventName: string): Observable<T> {
        return new Observable((subscriber) => {
            this.socket.on(eventName, (data: T) => {
                subscriber.next(data);
            });
        });
    }

    disconnect(): void {
        this.socket.disconnect();
    }
}
