import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlayersListComponent } from '@app/components/players-list/players-list.component';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Avatar, Game, Player } from '@common/game';
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
        private characterService: CharacterService,
    ) {}

    waitingRoomCode: string;
    mapName: string;
    player: Player;
    socketSubscription: Subscription = new Subscription();
    isCreatingGame: boolean = false;

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
        const availableAvatars: Avatar[] = [];
        const characters = await firstValueFrom(this.characterService.getCharacters());
        characters.forEach((character) => {
            availableAvatars.push(character.id);
        });
        const newGame: Game = {
            ...map,
            id: this.waitingRoomCode,
            players: [this.player],
            hostSocketId: '',
            availableAvatars: [...availableAvatars],
            currentTurn: 0,
            nDoorsManipulated: 0,
            visitedTiles: [],
            duration: 0,
            nTurns: 0,
            debug: false,
            isLocked: false,
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
            this.socketService.listen('playerJoined').subscribe((message) => {
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
