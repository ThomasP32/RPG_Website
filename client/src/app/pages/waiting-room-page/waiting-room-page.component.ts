import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { PlayersListComponent } from '@app/components/players-list/players-list.component';
import { ProfileModalComponent } from '@app/components/profile-modal/profile-modal.component';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { GameService } from '@app/services/game/game.service';
import { MapConversionService } from '@app/services/map-conversion/map-conversion.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { TIME_LIMIT_DELAY, WaitingRoomParameters } from '@common/constants';
import { ChatEvents } from '@common/events/chat.events';
import { GameCreationEvents, ToggleGameLockStateData } from '@common/events/game-creation.events';
import { Game, GameCtf, Player } from '@common/game';
import { Map, Mode } from '@common/map.types';
import { firstValueFrom, Subscription } from 'rxjs';

@Component({
    selector: 'app-waiting-room-page',
    standalone: true,
    imports: [CommonModule, PlayersListComponent, ChatroomComponent, ProfileModalComponent],
    templateUrl: './waiting-room-page.component.html',
    styleUrls: ['./waiting-room-page.component.scss'],
})
export class WaitingRoomPageComponent implements OnInit, OnDestroy {
    @ViewChild(PlayersListComponent, { static: false }) appPlayersListComponent!: PlayersListComponent;

    constructor(
        private readonly communicationMapService: CommunicationMapService,
        private readonly gameService: GameService,
        private readonly characterService: CharacterService,
        private readonly playerService: PlayerService,
        private readonly socketService: SocketService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly mapConversionService: MapConversionService,
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
    showProfileModal: boolean = false;

    async ngOnInit(): Promise<void> {
        if (!this.socketService.isSocketAlive()) {
            this.ngOnDestroy();
            this.characterService.resetCharacterAvailability();
            this.socketService.disconnect();
            this.router.navigate(['/main-menu']);
            return;
        }
        const player = this.playerService.player;
        this.playerPreview = this.characterService.getAvatarPreview(player.avatar);
        this.playerName = player.name;

        this.listenToSocketMessages();
        if (this.router.url.includes('host')) {
            this.isHost = true;
            this.getMapName();
            this.generateRandomNumber();
            await this.createNewGame(this.mapName);
        } else {
            this.waitingRoomCode = this.route.snapshot.params['gameId'];
        }
        this.socketService.sendMessage(GameCreationEvents.GetGameData, this.waitingRoomCode);
        this.socketService.sendMessage(GameCreationEvents.GetPlayers, this.waitingRoomCode);
        this.socketService.sendMessage(ChatEvents.JoinChatRoom, this.waitingRoomCode);
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
        let newGame: Game | GameCtf;
        if (map.mode === Mode.Ctf) {
            newGame = this.gameService.createNewCtfGame(map, this.waitingRoomCode);
        } else {
            newGame = this.gameService.createNewGame(map, this.waitingRoomCode);
        }
        this.socketService.sendMessage(GameCreationEvents.CreateGame, newGame);
    }

    exitGame(): void {
        this.socketService.sendMessage(GameCreationEvents.LeaveGame, this.waitingRoomCode);
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
        this.socketService.sendMessage(GameCreationEvents.InitializeGame, this.waitingRoomCode);
    }

    listenToSocketMessages(): void {
        if (!this.isHost) {
            this.socketSubscription.add(
                this.socketService.listen(GameCreationEvents.GameClosed).subscribe(() => {
                    this.dialogBoxMessage = "L'hôte de la partie a quitté.";
                    this.showExitModal = true;
                    setTimeout(() => {
                        this.exitGame();
                    }, TIME_LIMIT_DELAY);
                }),
            );
            this.socketSubscription.add(
                this.socketService.listen<boolean>(GameCreationEvents.GameLockToggled).subscribe((isLocked) => {
                    this.isGameLocked = isLocked;
                }),
            );
        }
        this.socketSubscription.add(
            this.socketService.listen<Game>(GameCreationEvents.GameInitialized).subscribe((game) => {
                this.gameService.setGame(game);
                game.players.forEach((player) => {
                    if (player.socketId === this.player.socketId) {
                        this.playerService.setPlayer(player);
                    }
                });
                this.gameInitialized = true;
                this.navigateToGamePage();
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Player[]>(GameCreationEvents.CurrentPlayers).subscribe((players: Player[]) => {
                this.activePlayers = players;
                this.numberOfPlayers = players.length;
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<Game>(GameCreationEvents.CurrentGame).subscribe((game) => {
                if (game && game.mapSize) {
                    if (this.isHost) {
                        this.maxPlayers = this.mapConversionService.getMaxPlayers(game.mapSize.x);
                    } else {
                        this.mapName = game.name;
                        this.maxPlayers = this.mapConversionService.getMaxPlayers(game.mapSize.x);
                    }
                }
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Player[]>(GameCreationEvents.PlayerJoined).subscribe((players: Player[]) => {
                this.activePlayers = players;
                this.numberOfPlayers = players.length;

                if (this.isHost) {
                    this.socketService.sendMessage(GameCreationEvents.IfStartable, this.waitingRoomCode);
                    this.socketSubscription.add(
                        this.socketService.listen(GameCreationEvents.IsStartable).subscribe(() => {
                            this.isStartable = true;
                        }),
                    );
                }
                if (this.numberOfPlayers === this.maxPlayers) {
                    const toggleGameLockStateData: ToggleGameLockStateData = { isLocked: true, gameId: this.waitingRoomCode };
                    this.socketService.sendMessage(GameCreationEvents.ToggleGameLockState, toggleGameLockStateData);
                }
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen(GameCreationEvents.PlayerKicked).subscribe(() => {
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
            this.socketService.listen<Player[]>(GameCreationEvents.PlayerLeft).subscribe((players: Player[]) => {
                if (this.isHost) {
                    this.isStartable = false;
                    this.socketService.sendMessage(GameCreationEvents.IfStartable, this.waitingRoomCode);
                }
                this.activePlayers = players;
                this.numberOfPlayers = players.length;
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen(GameCreationEvents.IsStartable).subscribe(() => {
                this.isStartable = true;
            }),
        );
    }

    toggleHover(state: boolean): void {
        this.hover = state;
    }

    toggleGameLockState(): void {
        this.isGameLocked = !this.isGameLocked;
        const toggleGameLockStateData: ToggleGameLockStateData = { isLocked: this.isGameLocked, gameId: this.waitingRoomCode };
        this.socketService.sendMessage(GameCreationEvents.ToggleGameLockState, toggleGameLockStateData);
    }

    isGameMaxed(): boolean {
        return this.numberOfPlayers === this.maxPlayers;
    }

    navigateToGamePage() {
        this.router.navigate([`/game/${this.waitingRoomCode}/${this.mapName}`], {
            state: { player: this.player, gameId: this.waitingRoomCode },
        });
    }

    openProfileModal(): void {
        this.showProfileModal = true;
    }

    closeProfileModal(): void {
        this.showProfileModal = false;
    }

    ngOnDestroy(): void {
        if (this.socketSubscription) {
            this.socketSubscription.unsubscribe();
        }
    }
}
