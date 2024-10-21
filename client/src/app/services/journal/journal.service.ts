import { DatePipe } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { SocketService } from '../communication-socket/communication-socket.service';

@Injectable({
    providedIn: 'root',
})
export class JournalService {
    @Inject(SocketService) private socketService: SocketService;

    private journalEntriesSubject = new BehaviorSubject<{ message: String; timeStamp: DatePipe }[]>([]);
    journalEntries$ = this.journalEntriesSubject.asObservable();

    ngOnInit(): void {
        this.socketService.socket.connect();
        this.handleAbandonGame();
    }

    private handleAbandonGame(): void {
        // Abandon de partie
        this.socketService.listen<{ playerName: String; gameId: String }>('playerDisconnected').subscribe((data) => {
            const timeStamp = new DatePipe('fr-CA', 'short');
            const message = `${data.playerName} s'est déconnecté de la partie ${data.gameId}`;
            this.journalEntriesSubject.next([...this.journalEntriesSubject.value, { message, timeStamp }]);
        });
    }
    //     private handleStartTurn(): void {} // Début de tour
    //     private handleStartCombat(): void {} // Début de combat
    //     private handleEndCombat(): void {} // Fin et résultat du combat
    //     private handlePickupItem(): void {} // Ramassage d'un item
    //     private handlePickupFlag(): void {} // Ramassage du drapeau
    //     private handleOpenDoor(): void {} // Ouverture de porte
    //     private handleCloseDoor(): void {} // Fermeture de porte
    //     private handleEndGame(): void {} // Fin de partie
    //     private handleDebugMode(): void {} // Activation ou désactivation du mode de débogage

    //     //Only for players involved in the combat
    //     private handleAttack(): void {} // Attaque et résultat
    //     private handleEscape(): void {} // Tentative d'évasion et résultat
    // }

    // nouveaux messages au bas, et barre de défilement au besoin.
    // Chaque message est horodaté selon le format HH:MM:SS.

    // Chaque événement doit être clair et comprendre le nom du ou des joueurs impliqués.
    // Un filtre doit permettre à l’utilisateur de ne voir que les événements dans lesquels il est
    // impliqué.
}
