import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { PlayersListComponent } from '@app/components/players-list/players-list.component';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Game, Player } from '@common/game';
import { Map } from '@common/map.types';
import { firstValueFrom, Subscription } from 'rxjs';

const minCode = 1000;
const maxCode = 9999;
const timeLimit = 3000;
@Component({
    selector: 'app-waiting-room-page',
    standalone: true,
    imports: [CommonModule, PlayersListComponent, ChatroomComponent],
    templateUrl: './waiting-room-page.component.html',
    styleUrls: ['./waiting-room-page.component.scss'],
})
export class WaitingRoomPageComponent implements OnInit, OnDestroy {
    @ViewChild(PlayersListComponent, { static: false }) appPlayersListComponent!: PlayersListComponent;
    /* eslint-disable no-unused-vars */
    constructor(
        private communicationMapService: CommunicationMapService,
        private characterService: CharacterService,
        private playerService: PlayerService,
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
    hover: boolean = false;
    activePlayers: Player[] = [];
    showExitModal: boolean = false;
    dialogBoxMessage: string;

    async ngOnInit(): Promise<void> {
        this.player = this.playerService.getPlayer();
        console.log('Player:', this.playerService.getPlayer());
        this.playerPreview = this.characterService.getAvatarPreview(this.player.avatar);
        this.playerName = this.player.name;

        this.listenToSocketMessages();
        if (this.router.url.includes('host')) {
            this.isHost = true;
            this.getMapName();
            this.generateRandomNumber();
            await this.createNewGame(this.mapName);
        } else {
            this.waitingRoomCode = this.route.snapshot.params['gameId'];
            //pourquoi on getGame et getPlayers ici?
            this.socketService.sendMessage('getGame', this.waitingRoomCode);
            this.socketService.sendMessage('getPlayers', this.waitingRoomCode);
            this.socketService.sendMessage('getMapName', this.waitingRoomCode);
        }
        this.socketService.sendMessage('getPlayers', this.waitingRoomCode);
    }

    generateRandomNumber(): void {
        this.waitingRoomCode = Math.floor(minCode + Math.random() * (maxCode - minCode + 1)).toString();
    }

    async createNewGame(mapName: string): Promise<void> {
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
        this.socketService.sendMessage('createGame', newGame);
    }

    exitGame(): void {
        this.socketService.disconnect();
        this.characterService.resetCharacterAvailability();
        this.router.navigate(['/main-menu']);
    }

    getMapName(): void {
        const name = this.route.snapshot.params['mapName'];
        if (!name) {
            this.router.navigate(['/create-game']);
        } else {
            this.mapName = name;
        }
    }

    startGame(): void {
        this.socketService.sendMessage('initializeGame', this.waitingRoomCode);
    }

    listenToSocketMessages(): void {
        if (!this.isHost) {
            this.socketSubscription.add(
                this.socketService.listen('gameClosed').subscribe(() => {
                    this.dialogBoxMessage = "L'hôte de la partie a quitté.";
                    this.showExitModal = true;
                    setTimeout(() => {
                        this.exitGame();
                    }, timeLimit);
                }),
            );
            this.socketSubscription.add(
                this.socketService.listen<{ isLocked: boolean }>('gameLockToggled').subscribe((data) => {
                    this.isGameLocked = data.isLocked;
                }),
            );
        }
        this.socketSubscription.add(
            this.socketService.listen('gameInitialized').subscribe(() => {
                this.navigateToGamePage();
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Player[]>('playerJoined').subscribe((players: Player[]) => {
                this.activePlayers = players;
                if (this.isHost) {
                    this.socketService.sendMessage('ifStartable', this.waitingRoomCode);
                    this.socketSubscription.add(
                        this.socketService.listen('isStartable').subscribe((data) => {
                            this.isStartable = true;
                            console.log('Game is startable');
                        }),
                    );
                }
            }),
        );
        // Permet de mettre a jour la liste des joueurs actifs pour l'affichage dans la salle d'attente
        this.socketSubscription.add(
            this.socketService.listen<Player[]>('currentPlayers').subscribe((players: Player[]) => {
                this.activePlayers = players;
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<string>('currentMapName').subscribe((name) => {
                this.mapName = name;
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen('playerKicked').subscribe(() => {
                this.dialogBoxMessage = 'Vous avez été exclu';
                this.showExitModal = true;
                setTimeout(() => {
                    this.exitGame();
                }, timeLimit);
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Player[]>('playerLeft').subscribe((players: Player[]) => {
                if (this.isHost) {
                    this.isStartable = false;
                    this.socketService.sendMessage('ifStartable', this.waitingRoomCode);
                }
                this.activePlayers = players;
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen('isStartable').subscribe(() => {
                this.isStartable = true;
                this.isGameLocked = true;
            }),
        );
    }

    toggleHover(state: boolean): void {
        this.hover = state;
    }
    toggleGameLockState(): void {
        this.isGameLocked = !this.isGameLocked;
        this.socketService.sendMessage('toggleGameLockState', { isLocked: this.isGameLocked, gameId: this.waitingRoomCode });
    }

    ngOnDestroy(): void {
        if (this.socketSubscription) {
            this.socketSubscription.unsubscribe();
        }
    }

    // esquisse de comment prévenir l'utilisateur que refresh ca le fait quitter la partie

    navigateToGamePage() {
        console.log('Navigating to game page with gameId:', this.waitingRoomCode, 'and mapName:', this.mapName);
        this.router.navigate([`/game/${this.waitingRoomCode}/${this.mapName}`], {
            state: { player: this.player, gameId: this.waitingRoomCode },
        });
    }
}
