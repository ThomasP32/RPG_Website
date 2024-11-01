import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { CombatModalComponent } from '@app/components/combat-modal/combat-modal.component';
import { GameMapComponent } from '@app/components/game-map/game-map.component';
import { PlayersListComponent } from '@app/components/players-list/players-list.component';
import { MovesMap } from '@app/interfaces/moves';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CountdownService } from '@app/services/countdown/countdown.service';
import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Game, Player, Specs } from '@common/game';
import { Coordinate, Map } from '@common/map.types';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [CommonModule, GameMapComponent, ChatroomComponent, RouterLink, CombatModalComponent, PlayersListComponent],
    templateUrl: './game-page.html',
    styleUrl: './game-page.scss',
})
export class GamePageComponent implements OnInit, OnDestroy {
    numberOfPlayers: number;
    opponent: Player;
    activePlayers: Player[];

    currentPlayerTurn: string;
    isYourTurn: boolean = false;
    delayFinished: boolean = true;
    isPulsing = false;
    countdown: number = 30;

    socketSubscription: Subscription = new Subscription();
    playerPreview: string;
    gameId: string;
    combatRoomId: string;
    showExitModal = false;
    showKickedModal = false;
    gameOverMessage = false;
    youFell: boolean = false;
    map: Map;
    specs: Specs;

    isCombatModalOpen = false;

    constructor(
        private router: Router,
        private socketService: SocketService,
        private characterService: CharacterService,
        private playerService: PlayerService,
        private gameService: GameService,
        private gameTurnService: GameTurnService,
        private countDownService: CountdownService,
    ) {
        this.router = router;
        this.socketService = socketService;
        this.characterService = characterService;
        this.playerService = playerService;
        this.gameTurnService = gameTurnService;
        this.countDownService = countDownService;
        this.gameService = gameService;
    }

    ngOnInit() {
        if (this.player && this.game) {
            this.listenForFalling();
            this.listenForCountDown();
            this.combatListener();
            this.listenPlayersLeft();
            this.listenForCurrentPlayerUpdates();
            this.gameTurnService.listenForTurn();
            this.gameTurnService.listenForPlayerMove();
            this.gameTurnService.listenMoves();
            this.activePlayers = this.game.players;
            this.countDownService.resetCountdown();
            this.playerPreview = this.characterService.getAvatarPreview(this.player.avatar);

            if (this.player.socketId === this.game.hostSocketId) {
                this.socketService.sendMessage('startGame', this.game.id);
            }
        }
    }

    get player(): Player {
        return this.playerService.player;
    }

    get game(): Game {
        return this.gameService.game;
    }

    listenPlayersLeft() {
        this.socketSubscription.add(
            this.socketService.listen<Player[]>('playerLeft').subscribe((players: Player[]) => {
                this.activePlayers = players.filter((player) => player.isActive);
                if (this.isCombatModalOpen && this.combatRoomId) {
                    const playersInCombat = this.activePlayers.filter(
                        (player) => player.socketId === this.player.socketId || player.socketId === this.opponent.socketId,
                    );
                    const activePlayersInCombat = playersInCombat.filter((player) => player.isActive);
                    const inactivePlayersInCombat = playersInCombat.filter((player) => !player.isActive);
                    if (activePlayersInCombat.length === 1 && inactivePlayersInCombat.length === 1) {
                        const combatWinner = activePlayersInCombat[0];
                        const combatLooser = inactivePlayersInCombat[0];
                        this.socketService.sendMessage('combatFinishedNormal', {
                            gameId: this.gameService.game.id,
                            combatWinner: combatWinner,
                            combatLooser: combatLooser,
                            combatRoomId: this.combatRoomId,
                        });
                    }
                }
                if (this.activePlayers.length <= 1) {
                    this.showExitModal = false;
                    this.showKickedModal = true;
                    setTimeout(() => {
                        // this.gameTurnService.endGame();
                        this.navigateToMain();
                    }, 3000);
                }
            }),
        );
    }

    endTurn() {
        this.gameTurnService.endTurn();
    }

    combatListener() {
        this.socketSubscription.add(
            this.socketService
                .listen<{ message: string; combatRoomId: string; challenger: Player; opponent: Player }>('combatStarted')
                .subscribe((data) => {
                    console.log(`${data.message} in room ${data.combatRoomId}`);
                    if (this.player.socketId === data.challenger.socketId) {
                        this.opponent = data.opponent;
                    } else {
                        this.opponent = data.challenger;
                    }
                    this.combatRoomId = data.combatRoomId;
                    this.isCombatModalOpen = true;
                }),
        );

        this.socketSubscription.add(
            this.socketService.listen<string>('combatFinishedByEvasion').subscribe((message) => {
                console.log(message);
                setTimeout(() => {
                    this.isCombatModalOpen = false;
                }, 3000);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ message: string; combatWinner: Player; combatLooser: Player }>('combatFinishedNormally').subscribe((data) => {
                console.log(data.message);
                for (let player of this.activePlayers) {
                    if (player.socketId === data.combatLooser.socketId) {
                        player = data.combatLooser;
                    } else if (player.socketId === data.combatWinner.socketId) {
                        player = data.combatWinner;
                    }
                }
                console.log('Players updated after combat:', this.activePlayers);
                setTimeout(() => {
                    this.isCombatModalOpen = false;
                }, 3000);
            }),
        );
    }

    navigateToMain(): void {
        this.socketService.disconnect();
        this.router.navigate(['/main-menu']);
    }

    navigateToEndOfGame(): void {
        this.navigateToMain();
        // this.router.navigate([`/endOfGame/${this.game.id}`]);
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
                console.log('cest ton tour!');
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

    listenForGameOver() {
        this.gameTurnService.playerWon$.subscribe((isGameOver) => {
            this.gameOverMessage = isGameOver;
            setTimeout(() => {
                this.navigateToEndOfGame();
            }, 5000);
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

    startCombat(): void {
        //TODO: Change opponent to real opponent
        this.socketService.sendMessage('startCombat', { gameId: this.gameService.game.id, opponent: this.activePlayers[1] });
    }

    ngOnDestroy() {
        this.socketSubscription.unsubscribe();
        this.socketService.disconnect();
    }
}
