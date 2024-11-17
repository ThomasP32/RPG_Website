import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { PlayersListComponent } from '@app/components/players-list/players-list.component';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { GameService } from '@app/services/game/game.service';
import { MapConversionService } from '@app/services/map-conversion/map-conversion.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { TIME_LIMIT_DELAY, WaitingRoomParameters } from '@common/constants';
import { Game, Player } from '@common/game';
import { Map } from '@common/map.types';
import { firstValueFrom, Subscription } from 'rxjs';

@Component({
    selector: 'app-waiting-room-page',
    standalone: true,
    imports: [CommonModule, PlayersListComponent, ChatroomComponent],
    templateUrl: './waiting-room-page.component.html',
    styleUrls: ['./waiting-room-page.component.scss'],
})
export class WaitingRoomPageComponent implements OnInit, OnDestroy {
    @ViewChild(PlayersListComponent, { static: false }) appPlayersListComponent!: PlayersListComponent;

    constructor(
        private communicationMapService: CommunicationMapService,
        private gameService: GameService,
        private characterService: CharacterService,
        private playerService: PlayerService,
        private socketService: SocketService,
        private route: ActivatedRoute,
        private router: Router,
        private mapConversionService: MapConversionService,
    ) {
        this.communicationMapService = communicationMapService;
        this.gameService = gameService;
        this.characterService = characterService;
        this.playerService = playerService;
        this.socketService = socketService;
        this.route = route;
        this.router = router;
        this.mapConversionService = mapConversionService;
    }

    waitingRoomCode: string;
    mapName: string;
    socketSubscription: Subscription = new Subscription();
    isHost: boolean = false;
    playerPreview: string;
    playerName: string;
    isStartable: boolean = false;
    isGameLocked: boolean = false;
    counterInitialized: boolean = false;
    gameInitialized: boolean = false;
    hover: boolean = false;
    activePlayers: Player[] = [];
    showExitModal: boolean = false;
    dialogBoxMessage: string;
    numberOfPlayers: number;
    maxPlayers: number;

    async ngOnInit(): Promise<void> {
        const player = this.playerService.player;
        this.playerPreview = await this.characterService.getAvatarPreview(player.avatar);
        this.playerName = player.name;

        this.listenToSocketMessages();
        if (this.router.url.includes('host')) {
            this.isHost = true;
            this.getMapName();
            this.generateRandomNumber();
            await this.createNewGame(this.mapName);
        } else {
            this.waitingRoomCode = this.route.snapshot.params['gameId'];

            this.socketService.sendMessage('getPlayers', this.waitingRoomCode);
        }
        this.socketService.sendMessage('getGameData', this.waitingRoomCode);
        this.socketService.sendMessage('getPlayers', this.waitingRoomCode);
    }

    generateRandomNumber(): void {
        this.waitingRoomCode = Math.floor(
            WaitingRoomParameters.MIN_CODE + Math.random() * (WaitingRoomParameters.MAX_CODE - WaitingRoomParameters.MIN_CODE + 1),
        ).toString();
    }

    get player(): Player {
        return this.playerService.player;
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
        this.socketService.sendMessage('leaveGame', this.waitingRoomCode);
        this.characterService.resetCharacterAvailability();
        this.socketService.disconnect();
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
                    }, TIME_LIMIT_DELAY);
                }),
            );
            this.socketSubscription.add(
                this.socketService.listen<{ isLocked: boolean }>('gameLockToggled').subscribe((data) => {
                    this.isGameLocked = data.isLocked;
                }),
            );
        }
        this.socketSubscription.add(
            this.socketService.listen<{ game: Game }>('gameInitialized').subscribe((data) => {
                this.gameService.setGame(data.game);
                this.gameInitialized = true;
                this.navigateToGamePage();
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Player[]>('currentPlayers').subscribe((players: Player[]) => {
                this.activePlayers = players;
                this.numberOfPlayers = players.length;
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ game: Game; name: string; size: number }>('currentGameData').subscribe((data) => {
                if (this.isHost) {
                    this.maxPlayers = this.mapConversionService.getMaxPlayers(data.size);
                } else {
                    this.mapName = data.name;
                    this.maxPlayers = this.mapConversionService.getMaxPlayers(data.size);
                }
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Player[]>('playerJoined').subscribe((players: Player[]) => {
                this.activePlayers = players;
                this.numberOfPlayers = players.length;

                if (this.isHost) {
                    this.socketService.sendMessage('ifStartable', this.waitingRoomCode);
                    this.socketSubscription.add(
                        this.socketService.listen('isStartable').subscribe(() => {
                            this.isStartable = true;
                        }),
                    );
                }
                if (this.numberOfPlayers === this.maxPlayers) {
                    this.socketService.sendMessage('toggleGameLockState', { isLocked: true, gameId: this.waitingRoomCode });
                }
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen('playerKicked').subscribe(() => {
                this.dialogBoxMessage = 'Vous avez été exclu';
                this.showExitModal = true;
                setTimeout(() => {
                    this.router.navigate(['/main-menu']);
                }, TIME_LIMIT_DELAY);
                this.socketService.disconnect();
                this.characterService.resetCharacterAvailability();
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Player[]>('playerLeft').subscribe((players: Player[]) => {
                if (this.isHost) {
                    this.isStartable = false;
                    this.socketService.sendMessage('ifStartable', this.waitingRoomCode);
                }
                this.activePlayers = players;
                this.numberOfPlayers = players.length;
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen('isStartable').subscribe(() => {
                this.isStartable = true;
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

    isGameMaxed(): boolean {
        return this.numberOfPlayers === this.maxPlayers;
    }

    ngOnDestroy(): void {
        if (this.socketSubscription) {
            this.socketSubscription.unsubscribe();
        }
    }

    navigateToGamePage() {
        this.router.navigate([`/game/${this.waitingRoomCode}/${this.mapName}`], {
            state: { player: this.player, gameId: this.waitingRoomCode },
        });
    }
}
