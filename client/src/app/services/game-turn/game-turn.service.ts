import { Injectable } from '@angular/core';
import { MovesMap } from '@app/interfaces/moves';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Game, Player } from '@common/game';
import { Coordinate } from '@common/map.types';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameTurnService {
    socketSubscription: Subscription = new Subscription();
    moves: MovesMap = new Map();
    private playerTurn = new BehaviorSubject<string>('');
    public playerTurn$ = this.playerTurn.asObservable();
    private youFell = new BehaviorSubject<boolean>(false);
    public youFell$ = this.youFell.asObservable();
    private playerWon = new BehaviorSubject<boolean>(false);
    public playerWon$ = this.playerWon.asObservable();
    isMoving = false;

    constructor(
        private gameService: GameService,
        private playerService: PlayerService,
        private socketService: SocketService,
    ) {
        this.listenForTurn();
        this.listenForPlayerMove();
        this.listenMoves();
        this.gameService = gameService;
        this.playerService = playerService;
        this.socketService = socketService;
    }

    get player(): Player {
        return this.playerService.player;
    }

    get game(): Game {
        return this.gameService.game;
    }

    startTurn(): void {
        if (this.playerTurn.getValue() === this.player.name) {
            console.log('cest ton tour');
            setTimeout(() => this.getMoves(), 3000);
        }
    }

    resumeTurn(): void {
        if (this.playerTurn.getValue() === this.player.name) {
            this.getMoves();
        }
    }

    endTurn(): void {
        if (!this.youFell.getValue()) {
            this.clearMoves();
            this.socketService.sendMessage('endTurn', this.game.id);
        }
    }

    endTurnBecauseFell(): void {
        this.youFell.next(true);
        setTimeout(() => {
            this.youFell.next(false);
            this.clearMoves();
            this.endTurn();
        }, 3000);
    }

    listenForTurn() {
        this.socketSubscription.add(
            this.socketService.listen<Player>('yourTurn').subscribe((yourPlayer) => {
                this.verifyPlayerWin();
                this.playerService.player = yourPlayer;
                this.clearMoves();
                this.playerTurn.next(yourPlayer.name);
                console.log('cest ton tour qui commence');
                this.startTurn();
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<string>('playerTurn').subscribe((playerName) => {
                this.clearMoves();
                this.playerTurn.next(playerName);
                console.log('cest le tour de ', playerName, ' qui commence');
            }),
        );
    }

    getMoves(): void {
        this.listenMoves();
        this.socketService.sendMessage('getMovements', this.game.id);
    }

    listenMoves(): void {
        this.socketSubscription.add(
            this.socketService.listen<[string, { path: Coordinate[]; weight: number }][]>('playerPossibleMoves').subscribe((paths) => {
                console.log('tu as recu tes mouvements');
                this.moves = new Map();
                this.moves = new Map(paths);
                if (this.moves.size === 1) {
                    console.log('tu peux plus bouger tu déclare forfait');
                    this.endTurn();
                }
            }),
        );
    }

    clearMoves(): void {
        this.moves = new Map();
    }

    movePlayer(position: Coordinate) {
        this.socketService.sendMessage('moveToPosition', { playerTurn: this.player.turn, gameId: this.game.id, destination: position });
    }

    listenForPlayerMove(): void {
        this.socketSubscription.add(
            this.socketService.listen<{ game: Game; player: Player }>('positionToUpdate').subscribe(async (data) => {
                if (data.player.socketId === this.player.socketId) {
                    this.playerService.setPlayer(data.player);
                }
                this.gameService.setGame(data.game);
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen('youFinishedMoving').subscribe(() => {
                this.clearMoves();
                this.resumeTurn();
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen('youFell').subscribe(() => {
                this.clearMoves();
                this.endTurnBecauseFell();
            }),
        );
    }

    verifyPlayerWin(): void {
        this.socketService.sendMessage('hasPlayerWon', this.game.id);
    }

    // listenForPlayerWin(): void {
    //     this.socketSubscription.add(
    //         this.socketService.listen('playerWon').subscribe(() => {
    //             this.playerWon.next(true);
    //             this.endGame();
    //         }),
    //     );
    // }

    // endGame(): void {
    //     this.socketSubscription.unsubscribe();
    // }
}
