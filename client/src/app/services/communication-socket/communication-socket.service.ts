import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    public socket: Socket;

    // TODO: la connexion devrait se faire automatiquement à partir de n'importe quelle page?
    // mais la on a le problème de si quelqu'un refresh
    // du coup il faudrait que la connexion se fasse automatiquement à partir de n'importe quelle page sauf à
    // celle ou on est déjà supposé etre connecté et on renverrais a main page si un acces se fait de la
    // on doit renvoyer a main page aussi si on refresh la page (ou juste utiliser isSocketAlive())
    constructor() {
        this.connect();
    }

    connect() {
        if (!this.socket) {
            this.socket = io(environment.socketUrl, { transports: ['websocket'] });
        }
        this.socket.connect();
    }
    // TODO: la connexion se maintient entre toute les pages tant que y'a pas de refresh (a partir du connect)
    // et si y'a un refresh on perd la connexion si c'est pas créé dans le constructeur de socketService
    // (faudrait retourner a main page pour faire la connexion)
    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    sendMessage<T>(event: string, data: T): void {
        console.log('sending message', event, data);
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
