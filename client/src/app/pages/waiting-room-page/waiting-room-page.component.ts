import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { PlayersListComponent } from '@app/components/players-list/players-list.component';
import { CharacterService } from '@app/services/character/character.service';
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
    imports: [PlayersListComponent, ChatroomComponent],
    templateUrl: './waiting-room-page.component.html',
    styleUrls: ['./waiting-room-page.component.scss'],
})
export class WaitingRoomPageComponent implements OnInit, OnDestroy {
    @ViewChild(PlayersListComponent, { static: false }) appPlayersListComponent!: PlayersListComponent;
    /* eslint-disable no-unused-vars */
    constructor(
        private communicationMapService: CommunicationMapService,
        private characterService: CharacterService,
        private socketService: SocketService,
        private route: ActivatedRoute,
        private router: Router,
    ) {}

    waitingRoomCode: string;
    mapName: string;
    player: Player;
    socketSubscription: Subscription = new Subscription();
    isHost: boolean = false;
    playerPreview: string;
    playerName: string;
    isStartable: boolean = false;
    isGameLocked: boolean = false;

    async ngOnInit(): Promise<void> {
        this.initializeView();
        this.player = history.state.player;
        this.playerPreview = this.characterService.getAvatarPreview(this.player.avatar);
        this.playerName = this.player.name;

        this.listenToSocketMessages();
        if (this.router.url.includes('host')) {
            this.isHost = true;
            this.getMapName();
            this.generateRandomNumber();
            await this.startNewGame(this.mapName);
        } else {
            this.waitingRoomCode = this.route.snapshot.params['gameId'];
        }
        this.socketService.sendMessage('getPlayers', this.waitingRoomCode);
    }

    initializeView(): void {}

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
        window.location.href = '/';
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
        // if (this.isHost) {
        //     this.socketSubscription.add(
        //         this.socketService.listen('gameStarted').subscribe(() => {
        //             console.log('You started a new game');
        //         }),
        //     );
        // }
        if (!this.isHost) {
            this.socketSubscription.add(
                this.socketService.listen('gameClosed').subscribe(() => {
                    window.location.href = '/';
                }),
            );
        }
        this.socketSubscription.add(
            this.socketService.listen<Player[]>('playerJoined').subscribe((players: Player[]) => {
                console.log('playerJoined:', players);
                if (this.isHost) {
                    this.socketService.sendMessage('ifStartable', this.waitingRoomCode);
                    this.socketSubscription.add(
                        this.socketService.listen('isStartable').subscribe((data) => {
                            console.log('Game is startable:', data);
                            this.isStartable = true;
                        }),
                    );
                }

                this.appPlayersListComponent.players = players;
                console.log('A new player joined the game:', players);
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Player[]>('playerLeft').subscribe((players: Player[]) => {
                if (this.isHost) {
                    this.isStartable = false;
                    this.socketService.sendMessage('ifStartable', this.waitingRoomCode);
                }
                this.appPlayersListComponent.players = players;
                console.log('A player left the game:');
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen('isStartable').subscribe(() => {
                console.log('Game is startable');
                this.isGameLocked = true;
                this.isStartable = true;
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Player[]>('currentPlayers').subscribe((players: Player[]) => {
                console.log('currentPlayers:', players);
                this.appPlayersListComponent.players = players;
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
