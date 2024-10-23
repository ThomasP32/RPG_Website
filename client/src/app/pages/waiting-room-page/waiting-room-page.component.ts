import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlayersListComponent } from '@app/components/players-list/players-list.component';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Game, Player } from '@common/game';
import { Map } from '@common/map.types';
import { firstValueFrom, Subscription } from 'rxjs';

const minCode = 1000;
const maxCode = 9999;

@Component({
    selector: 'app-waiting-room-page',
    standalone: true,
    imports: [PlayersListComponent],
    templateUrl: './waiting-room-page.component.html',
    styleUrls: ['./waiting-room-page.component.scss'],
})
export class WaitingRoomPageComponent implements OnInit, OnDestroy {
    /* eslint-disable no-unused-vars */
    constructor(
        private communicationMapService: CommunicationMapService,
        private socketService: SocketService,
        private route: ActivatedRoute,
        private router: Router,
    ) {}

    waitingRoomCode: string;
    mapName: string;
    player: Player;
    socketSubscription: Subscription = new Subscription();
    isCreatingGame: boolean = false;
    isStartable: boolean = false;

    async ngOnInit(): Promise<void> {
        this.player = history.state.player;
        this.listenToSocketMessages();
        if (this.router.url.includes('create-game')) {
            this.isCreatingGame = true;
            this.getMapName();
            this.generateRandomNumber();
            await this.startNewGame(this.mapName);
        } else {
            this.waitingRoomCode = this.route.snapshot.params['gameId'];
        }
    }

    generateRandomNumber(): void {
        this.waitingRoomCode = Math.floor(minCode + Math.random() * (maxCode - minCode + 1)).toString();
    }

    async startNewGame(mapName: string): Promise<void> {
        const map: Map = await firstValueFrom(this.communicationMapService.basicGet<Map>(`map/${mapName}`));
        const newGame: Game = {
            ...map,
            id: this.waitingRoomCode,
            players: [this.player],
            hostSocketId: '',
            currentTurn: 0,
            nDoorsManipulated: 0,
            duration: 0,
            nTurns: 0,
            debug: false,
            isLocked: false,
            hasStarted: false,
        };
        this.socketService.sendMessage('startGame', newGame);
    }

    exitGame(): void {
        this.router.navigate(['/']);
    }

    getMapName(): void {
        const name = this.route.snapshot.params['mapName'];
        if (!name) {
            this.router.navigate(['/create-game']);
        } else {
            this.mapName = name;
        }
    }

    listenToSocketMessages(): void {
        if (this.isCreatingGame) {
            this.socketSubscription.add(
                this.socketService.listen('gameStarted').subscribe(() => {
                    console.log('You started a new game');
                }),
            );
        }
        this.socketSubscription.add(
            // seulement a partir du premier joueur qui rejoint qu'on verifie si le game est startable 
            this.socketService.listen('playerJoined').subscribe((message) => {
                if (this.isCreatingGame) {
                    this.socketService.sendMessage('ifStartable', this.waitingRoomCode);
                    this.socketSubscription.add(
                        this.socketService.listen('isStartable').subscribe((message) => {
                            console.log('Game is startable:', message);
                            this.isStartable = true;
                        }),
                    );
                }
                console.log('A new player joined the game:', message);
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen('playerLeft').subscribe((message) => {
                if (this.isCreatingGame) {
                    this.isStartable = false;
                    this.socketService.sendMessage('ifStartable', this.waitingRoomCode);
                }
                console.log('A new player joined the game:', message);
            }),
        );
    }

    ngOnDestroy(): void {
        if (this.socketSubscription) {
            this.socketSubscription.unsubscribe();
        }
    }

    // esquisse de comment prévenir l'utilisateur que refresh ca le fait quitter la partie
    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(event: Event): void {
        event.preventDefault();
    }
}
