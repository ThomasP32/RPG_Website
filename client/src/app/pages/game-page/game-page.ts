import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActionsComponentComponent } from '@app/components/actions-component/actions-component.component';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { CombatListComponent } from '@app/components/combat-list/combat-list.component';
import { CombatModalComponent } from '@app/components/combat-modal/combat-modal.component';
import { GameMapComponent } from '@app/components/game-map/game-map.component';
import { GamePlayersListComponent } from '@app/components/game-players-list/game-players-list.component';
import { JournalComponent } from '@app/components/journal/journal.component';
import { PlayerInfosComponent } from '@app/components/player-infos/player-infos.component';
import { CharacterService } from '@app/services/character/character.service';
import { CombatService } from '@app/services/combat/combat.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CountdownService } from '@app/services/countdown/game/countdown.service';
import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { GameService } from '@app/services/game/game.service';
import { ImageService } from '@app/services/image/image.service';
import { MapConversionService } from '@app/services/map-conversion/map-conversion.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { TIME_LIMIT_DELAY, TIME_PULSE, TIME_REDIRECTION, TURN_DURATION } from '@common/constants';
import { MovesMap } from '@common/directions';
import { ChatEvents } from '@common/events/chat.events';
import { GameCreationEvents } from '@common/events/game-creation.events';
import { Game, Player, Specs } from '@common/game';
import { GamePageActiveView } from '@common/game-page';
import { Coordinate, DoorTile, Map } from '@common/map.types';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [
        CommonModule,
        GameMapComponent,
        ChatroomComponent,
        GamePlayersListComponent,
        CombatListComponent,
        CombatModalComponent,
        JournalComponent,
        ActionsComponentComponent,
        PlayerInfosComponent,
    ],
    templateUrl: './game-page.html',
    styleUrl: './game-page.scss',
})
export class GamePageComponent implements OnInit, OnDestroy {
    private readonly socketSubscription: Subscription = new Subscription();

    GamePageActiveView = GamePageActiveView;
    activeView: GamePageActiveView = GamePageActiveView.Chat;
    activePlayers: Player[];
    opponent: Player;
    possibleOpponents: Player[];
    possibleDoors: DoorTile[];
    doorActionAvailable: boolean = false;

    totalTime: number = 10;
    dashArray: string = '100';
    dashOffset: string = '100';

    currentPlayerTurn: string;
    playerPreview: string;

    isYourTurn: boolean = false;
    delayFinished: boolean = true;

    isPulsing = false;
    countdown: number | string = TURN_DURATION;
    startTurnCountdown: number = 3;

    showExitModal: boolean = false;
    showActionModal = false;
    showKickedModal = false;
    showEndGameModal = false;
    gameOverMessage = false;
    isCombatModalOpen = false;

    youFell: boolean = false;
    map: Map;
    specs: Specs;
    combatAvailable: boolean = false;
    gameMapComponent: GameMapComponent;

    constructor(
        private readonly router: Router,
        private readonly socketService: SocketService,
        private readonly characterService: CharacterService,
        private readonly playerService: PlayerService,
        private readonly gameService: GameService,
        private readonly gameTurnService: GameTurnService,
        private readonly countDownService: CountdownService,
        private readonly combatService: CombatService,
        protected readonly imageService: ImageService,
        protected readonly mapConversionService: MapConversionService,
    ) {
        this.router = router;
        this.socketService = socketService;
        this.characterService = characterService;
        this.playerService = playerService;
        this.gameTurnService = gameTurnService;
        this.countDownService = countDownService;
        this.gameService = gameService;
        this.combatService = combatService;
        this.imageService = imageService;
        this.mapConversionService = mapConversionService;
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
            this.gameTurnService.listenForEndOfGame();

            this.combatService.listenCombatStart();
            this.combatService.listenForCombatFinish();
            this.combatService.listenForEvasionInfo();

            this.listenForEndOfGame();
            this.listenForIsCombatModalOpen();
            this.listenForOpponent();
            this.listenForStartTurnDelay();
            this.listenForFalling();
            this.listenForCountDown();
            this.listenPlayersLeft();
            this.listenForCurrentPlayerUpdates();

            this.activePlayers = this.gameService.game.players;
            this.playerPreview = this.characterService.getAvatarPreview(this.player.avatar);

            if (this.playerService.player.socketId === this.game.hostSocketId) {
                this.socketService.sendMessage('startGame', this.gameService.game.id);
            }

            this.socketService.sendMessage(ChatEvents.JoinChatRoom, this.game.id);
        }
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

    toggleView(view: GamePageActiveView): void {
        this.activeView = view;
    }

    navigateToMain(): void {
        this.playerService.resetPlayer();
        this.characterService.resetCharacterAvailability();
        this.socketService.disconnect();
        this.router.navigate(['/main-menu']);
    }

    areModalsOpen(): boolean {
        return this.showExitModal || this.showActionModal || this.showKickedModal || this.isCombatModalOpen;
    }

    navigateToEndOfGame(): void {
        this.router.navigate(['/end-game']);
    }

    confirmExit(): void {
        this.socketService.disconnect();
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

    onTileClickToMove(position: Coordinate) {
        this.gameTurnService.movePlayer(position);
    }

    triggerPulse(): void {
        this.isPulsing = true;
        setTimeout(() => (this.isPulsing = false), TIME_PULSE);
    }

    protected listenForCurrentPlayerUpdates() {
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

    private listenForFalling() {
        this.gameTurnService.youFell$.subscribe((youFell) => {
            this.possibleOpponents = [];
            this.youFell = youFell;
        });
    }

    private listenForCountDown() {
        this.countDownService.countdown$.subscribe((time) => {
            this.countdown = time;
            this.triggerPulse();
        });
    }

    private listenForEndOfGame() {
        this.gameTurnService.playerWon$.subscribe((isGameOver) => {
            this.showExitModal = false;
            this.showEndGameModal = isGameOver;
            if (isGameOver) {
                setTimeout(() => {
                    this.navigateToEndOfGame();
                }, TIME_REDIRECTION);
            }
        });
    }

    private listenForIsCombatModalOpen() {
        this.combatService.isCombatModalOpen$.subscribe((isCombatModalOpen) => {
            this.isCombatModalOpen = isCombatModalOpen;
            if (isCombatModalOpen) {
                this.gameTurnService.clearMoves();
                this.combatAvailable = false;
            }
        });
    }

    private listenForOpponent() {
        this.combatService.opponent$.subscribe((opponent) => {
            this.opponent = opponent;
        });
    }

    listenPlayersLeft() {
        this.socketSubscription.add(
            this.socketService.listen<Player[]>(GameCreationEvents.PlayerLeft).subscribe((players: Player[]) => {
                this.gameService.game.players = players;
                this.activePlayers = players.filter((player) => player.isActive);
                if (this.activePlayers.length <= 1) {
                    this.showExitModal = false;
                    this.showKickedModal = true;
                    setTimeout(() => {
                        this.navigateToMain();
                    }, TIME_LIMIT_DELAY);
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

    ngOnDestroy(): void {
        this.socketSubscription.unsubscribe();
    }

    onShowExitModalChange(newValue: boolean) {
        this.showExitModal = newValue;
    }
}
