import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { GameMapComponent } from '@app/components/game-map/game-map.component';
import { PlayersListComponent } from '@app/components/players-list/players-list.component';
import { MovesMap } from '@app/interfaces/moves';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CountdownService } from '@app/services/countdown/countdown.service';
import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Game, Player, Specs } from '@common/game';
import { Coordinate, Map } from '@common/map.types';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [CommonModule, GameMapComponent, ChatroomComponent, RouterLink, PlayersListComponent],
    templateUrl: './game-page.html',
    styleUrl: './game-page.scss',
})
export class GamePageComponent implements OnInit, OnDestroy {
    numberOfPlayers: number;
    activePlayers: Player[];

    currentPlayerTurn: string;
    isYourTurn: boolean = false;
    delayFinished: boolean = true;
    isPulsing = false;
    countdown: number = 30;

    socketSubscription: Subscription = new Subscription();
    playerPreview: string;
    gameId: string;
    showExitModal = false;
    showKickedModal = false;
    youFell: boolean = false;
    map: Map;
    specs: Specs;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private socketService: SocketService,
        private characterService: CharacterService,
        private playerService: PlayerService,
        private gameTurnService: GameTurnService,
        private countDownService: CountdownService,
    ) {
        this.route = route;
        this.router = router;
        this.socketService = socketService;
        this.characterService = characterService;
        this.playerService = playerService;
        this.gameTurnService = gameTurnService;
        this.countDownService = countDownService;
    }

    ngOnInit() {
        this.listenForFalling();
        this.gameId = this.route.snapshot.params['gameId'];
        this.playerPreview = this.characterService.getAvatarPreview(this.player.avatar);
        this.loadGameData();
        this.loadPlayerData();
        this.socketService.sendMessage('getPlayers', this.gameId);
        this.socketService.sendMessage('getGame', this.gameId);
        this.listenForCountDown();
        this.countDownService.resetCountdown();
        this.gameTurnService.listenForTurn();
        this.listenPlayersLeft();
    }

    get player(): Player {
        return this.playerService.player;
    }

    listenPlayersLeft() {
        this.socketSubscription.add(
            this.socketService.listen<Player[]>('playerLeft').subscribe((players: Player[]) => {
                this.activePlayers = players.filter((player) => player.isActive);
                if (this.activePlayers.length <= 1) {
                    this.showExitModal = false;
                    this.showKickedModal = true;
                    setTimeout(() => {
                        this.navigateToMain();
                    }, 3000);
                }
            }),
        );
    }

    loadGameData() {
        this.socketService.listen<Game>('currentGame').subscribe((game: Game) => {
            if (game) {
                console.log(game.players);
                this.gameTurnService.game = game;
                if (this.player.socketId === this.game.hostSocketId) {
                    this.socketService.sendMessage('startGame', this.game.id);
                }
                this.listenForCurrentPlayerUpdates();
            } else {
                console.error('Failed to load game data');
            }
        });
    }

    get game(): Game {
        return this.gameTurnService.game;
    }

    endTurn() {
        this.gameTurnService.endTurn();
    }

    loadPlayerData() {
        this.socketService.listen<Player[]>('currentPlayers').subscribe((players: Player[]) => {
            if (players && players.length > 0) {
                this.activePlayers = players.filter((player) => player.isActive);
                this.playerService.setPlayer(players.filter((player) => player.socketId === this.player.socketId)[0]);
            } else {
                console.error('Failed to load players or no players available');
            }
        });
    }

    navigateToMain(): void {
        this.socketService.disconnect();
        this.router.navigate(['/main-menu']);
    }

    confirmExit(): void {
        this.navigateToMain();
        this.showExitModal = false;
        this.characterService.resetCharacterAvailability();
        this.playerService.resetPlayer();
    }

    openExitConfirmationModal(): void {
        this.showExitModal = true;
    }

    closeExitModal(): void {
        this.showExitModal = false;
    }

    listenForCurrentPlayerUpdates() {
        this.gameTurnService.playerTurn$.subscribe((playerName) => {
            this.currentPlayerTurn = playerName;
            this.isYourTurn = false;
            this.delayFinished = false;
            if (playerName === this.player.name) {
                this.isYourTurn = true;
            }
            this.playTurn();
        });
    }

    listenForFalling() {
        this.gameTurnService.youFell$.subscribe((youFell) => {
            this.countDownService.pauseCountdown();
            this.youFell = youFell;
        });
    }

    listenForCountDown() {
        this.countDownService.countdown$.subscribe((time) => {
            this.countdown = time;
            this.triggerPulse();
            if (this.countdown === 0) {
                this.gameTurnService.endTurn();
            }
        });
    }

    triggerPulse(): void {
        this.isPulsing = true;
        setTimeout(() => (this.isPulsing = false), 500);
    }

    get moves(): MovesMap {
        return this.gameTurnService.moves;
    }

    playTurn() {
        this.countDownService.resetCountdown();
        this.countDownService.pauseCountdown();
        setTimeout(() => {
            this.delayFinished = true;
            this.countDownService.startCountdown();
        }, 3000);
    }

    onTileClickToMove(position: Coordinate) {
        this.gameTurnService.movePlayer(position);
    }

    ngOnDestroy() {
        this.socketService.disconnect();
    }
}
