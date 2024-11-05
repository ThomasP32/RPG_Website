import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { CombatListComponent } from '@app/components/combat-list/combat-list.component';
import { CombatModalComponent } from '@app/components/combat-modal/combat-modal.component';
import { GameMapComponent } from '@app/components/game-map/game-map.component';
import { JournalComponent } from '@app/components/journal/journal.component';
import { PlayersListComponent } from '@app/components/players-list/players-list.component';
import { MovesMap } from '@app/interfaces/moves';
import { CharacterService } from '@app/services/character/character.service';
import { CombatService } from '@app/services/combat/combat.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CountdownService } from '@app/services/countdown/game/countdown.service';
import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { TURN_DURATION } from '@common/constants';
import { Game, Player, Specs } from '@common/game';
import { Coordinate, DoorTile, Map } from '@common/map.types';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [
        CommonModule,
        GameMapComponent,
        ChatroomComponent,
        RouterLink,
        PlayersListComponent,
        CombatListComponent,
        CombatModalComponent,
        JournalComponent,
    ],
    templateUrl: './game-page.html',
    styleUrl: './game-page.scss',
})
export class GamePageComponent implements OnInit, OnDestroy {
    activeView: 'chat' | 'journal' = 'chat';
    activePlayers: Player[];
    opponent: Player;
    possibleOpponents: Player[];
    possibleDoors: DoorTile[];

    currentPlayerTurn: string;
    playerPreview: string;

    isYourTurn: boolean = false;
    delayFinished: boolean = true;

    isPulsing = false;
    countdown: number | string = TURN_DURATION;
    startTurnCountdown: number = 3;

    gameId: string;

    showExitModal = false;
    showActionModal = false;
    showKickedModal = false;
    showEndGameModal = false;
    gameOverMessage = false;
    isCombatModalOpen = false;

    socketSubscription: Subscription = new Subscription();

    youFell: boolean = false;
    map: Map;
    specs: Specs;
    actionMessage: string = 'Actions possibles';
    doorActionAvailable: boolean = false;
    combatAvailable: boolean = false;
    gameMapComponent: GameMapComponent;

    constructor(
        private router: Router,
        private socketService: SocketService,
        private characterService: CharacterService,
        private playerService: PlayerService,
        private gameService: GameService,
        private gameTurnService: GameTurnService,
        private countDownService: CountdownService,
        private combatService: CombatService,
    ) {
        this.router = router;
        this.socketService = socketService;
        this.characterService = characterService;
        this.playerService = playerService;
        this.gameTurnService = gameTurnService;
        this.countDownService = countDownService;
        this.gameService = gameService;
        this.combatService = combatService;
    }

    ngOnInit() {
        if (this.player && this.game) {
            this.gameTurnService.listenForTurn();
            this.gameTurnService.listenForPlayerMove();
            this.gameTurnService.listenMoves();
            this.gameTurnService.listenForPossibleCombats();
            this.gameTurnService.listenForDoors();
            this.gameTurnService.listenForDoorUpdates();
            this.gameTurnService.listenForCombatConclusion();

            this.combatService.listenCombatStart();
            this.combatService.listenForCombatFinish();
            this.combatService.listenForEvasionInfo();

            this.listenForEndOfGame();
            this.listenForIsCombatModalOpen();
            this.listenForOpponent();
            this.listenForPossibleOpponents();
            this.listenForDoorOpening();
            this.listenForStartTurnDelay();
            this.listenForFalling();
            this.listenForCountDown();
            this.listenPlayersLeft();
            this.listenForCurrentPlayerUpdates();

            this.gameId = this.gameService.game.id;
            this.activePlayers = this.gameService.game.players;
            this.playerPreview = this.characterService.getAvatarPreview(this.player.avatar);

            if (this.playerService.player.socketId === this.game.hostSocketId) {
                this.socketService.sendMessage('startGame', this.gameService.game.id);
            }
        }
    }

    toggleView(view: 'chat' | 'journal'): void {
        this.activeView = view;
    }

    get player(): Player {
        return this.playerService.player;
    }

    get game(): Game {
        return this.gameService.game;
    }

    get moves(): MovesMap {
        return this.gameTurnService.moves;
    }

    endTurn() {
        this.gameTurnService.endTurn();
    }

    navigateToMain(): void {
        this.playerService.resetPlayer();
        this.characterService.resetCharacterAvailability();
        this.socketService.disconnect();
        this.router.navigate(['/main-menu']);
    }

    navigateToEndOfGame(): void {
        this.navigateToMain();
        // this.router.navigate([`/endOfGame/${this.game.id}`]);
    }

    confirmExit(): void {
        // quitter la partie
        this.socketService.disconnect();
        this.navigateToMain();
        this.showExitModal = false;
        this.characterService.resetCharacterAvailability();
        this.playerService.resetPlayer();
    }

    openExitConfirmationModal(): void {
        this.showExitModal = true;
    }
    openActionModal(): void {
        this.showActionModal = true;
    }

    closeExitModal(): void {
        this.showExitModal = false;
    }

    onTileClickToMove(position: Coordinate) {
        this.gameTurnService.movePlayer(position);
    }

    listenForCurrentPlayerUpdates() {
        this.gameTurnService.playerTurn$.subscribe((playerName) => {
            this.currentPlayerTurn = playerName;
            this.countdown = TURN_DURATION;
            this.isYourTurn = false;
            this.delayFinished = false;
            if (playerName === this.player.name) {
                this.isYourTurn = true;
            }
        });
    }

    listenForFalling() {
        this.gameTurnService.youFell$.subscribe((youFell) => {
            this.possibleOpponents = [];
            this.youFell = youFell;
        });
    }

    listenForCountDown() {
        this.countDownService.countdown$.subscribe((time) => {
            this.countdown = time;
            this.triggerPulse();
        });
    }

    listenForGameOver() {
        this.gameTurnService.playerWon$.subscribe((isGameOver) => {
            this.gameOverMessage = isGameOver;
            if (isGameOver) {
                setTimeout(() => {
                    this.navigateToEndOfGame();
                }, 5000);
            }
        });
    }

    listenForPossibleOpponents() {
        this.gameTurnService.possibleOpponents$.subscribe((possibleOpponents: Player[]) => {
            if (!this.gameTurnService.actionsDone.combat && possibleOpponents.length > 0) {
                this.combatAvailable = true;
                this.possibleOpponents = possibleOpponents;
            } else {
                this.combatAvailable = false;
                this.possibleOpponents = [];
            }
        });
    }

    listenForDoorOpening() {
        this.gameTurnService.possibleDoors$.subscribe((possibleDoors: DoorTile[]) => {
            if (!this.gameTurnService.actionsDone.door && possibleDoors.length > 0) {
                this.doorActionAvailable = true;
                this.possibleDoors = possibleDoors;
                if (possibleDoors[0].isOpened) {
                    this.actionMessage = 'Fermer la porte';
                } else {
                    this.actionMessage = 'Ouvrir la porte';
                }
            } else {
                this.doorActionAvailable = false;
                this.actionMessage = 'Actions possibles';
                this.possibleDoors = [];
            }
        });
    }

    toggleDoor() {
        if (this.doorActionAvailable) {
            this.gameTurnService.toggleDoor(this.possibleDoors[0]);
        }
    }
    triggerPulse(): void {
        this.isPulsing = true;
        setTimeout(() => (this.isPulsing = false), 500);
    }

    listenForIsCombatModalOpen() {
        this.combatService.isCombatModalOpen$.subscribe((isCombatModalOpen) => {
            this.isCombatModalOpen = isCombatModalOpen;
        });
    }

    listenForOpponent() {
        this.combatService.opponent$.subscribe((opponent) => {
            this.opponent = opponent;
        });
    }

    listenPlayersLeft() {
        this.socketSubscription.add(
            this.socketService.listen<Player[]>('playerLeft').subscribe((players: Player[]) => {
                this.activePlayers = players.filter((player) => player.isActive);
                this.gameService.game.players = players;
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

    listenForStartTurnDelay() {
        this.socketSubscription.add(
            this.socketService.listen<number>('delay').subscribe((delay) => {
                this.startTurnCountdown = delay;
                if (delay === 0) {
                    this.startTurnCountdown = 3;
                    this.delayFinished = true;
                }
            }),
        );
    }

    listenForEndOfGame() {
        this.socketSubscription.add(
            this.socketService.listen<Player>('gameFinishedPlayerWon').subscribe((winner) => {
                console.log('la game est finieeeeee!, ce joueur a gagné : ', winner.name);
                this.showExitModal = false;
                this.showEndGameModal = true;
                setTimeout(() => {
                    this.navigateToMain();
                }, 3000);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen('gameFinishedNoWin').subscribe(() => {
                console.log('la game est finieeeeee!, il reste plus assez de joueurs!! ');
                this.showExitModal = false;
                this.showKickedModal = true;
                setTimeout(() => {
                    // this.gameTurnService.endGame();
                    this.navigateToMain();
                }, 3000);
            }),
        );
    }

    ngOnDestroy() {
        this.socketSubscription.unsubscribe();
        this.socketService.disconnect();
    }
}
