import { Injectable } from '@angular/core';
import { MovesMap } from '@app/interfaces/moves';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Game, Player } from '@common/game';
import { Coordinate } from '@common/map.types';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameTurnService {
    game: Game;
    socketSubscription: Subscription = new Subscription();
    moves: MovesMap = new Map();
    private playerTurn = new BehaviorSubject<string>('');
    public playerTurn$ = this.playerTurn.asObservable();
    private youFell = new BehaviorSubject<boolean>(false);
    public youFell$ = this.youFell.asObservable();
    isMoving = false;

    constructor(
        private playerService: PlayerService,
        private socketService: SocketService,
    ) {
        this.playerService = playerService;
        this.socketService = socketService;
        this.listenForTurn();
        this.listenForPlayerMove();
        this.listenMoves();
    }

    get player(): Player {
        return this.playerService.player;
    }

    startTurn(): void {
        if (this.playerTurn.getValue() === this.player.name) {
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
                this.playerService.player = yourPlayer;
                this.clearMoves();
                this.playerTurn.next(this.player.name);
                this.startTurn();
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<string>('playerTurn').subscribe((playerName) => {
                this.clearMoves();
                this.playerTurn.next(playerName);
            }),
        );
    }

    // listenForTurnRotation() {
    //     this.socketSubscription.add(
    //         this.socketService.listen<Game>('playerFinishedTurn').subscribe((game) => {
    //             this.game = game;
    //         }),
    //     );
    // }

    getMoves() {
        this.listenMoves();
        this.socketService.sendMessage('getMovements', this.game.id);
    }

    listenMoves() {
        this.socketSubscription.add(
            this.socketService.listen<[string, { path: Coordinate[]; weight: number }][]>('playerPossibleMoves').subscribe((paths) => {
                this.moves = new Map();
                this.moves = new Map(paths);
                if (this.moves.size === 1) {
                    this.endTurn();
                }
            }),
        );
    }

    clearMoves() {
        this.moves = new Map();
    }

    movePlayer(position: Coordinate) {
        this.socketService.sendMessage('moveToPosition', { playerTurn: this.player.turn, gameId: this.game.id, destination: position });
    }

    listenForPlayerMove() {
        this.socketSubscription.add(
            this.socketService.listen<{ player: Player; path: Coordinate[] }>('positionToUpdate').subscribe(async (data) => {
                const player = this.game.players.find((player) => player.name === data.player.name);
                for (const move of data.path) {
                    player!.position = move;
                }
                if (player?.socketId === this.player.socketId) {
                    this.playerService.player = data.player;
                }
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Player>('youFinishedMoving').subscribe((updatedPlayer) => {
                this.playerService.player = updatedPlayer;
                this.clearMoves();
                this.resumeTurn();
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<Player>('youFell').subscribe((updatedPlayer) => {
                this.playerService.player = updatedPlayer;
                this.clearMoves();
                this.endTurnBecauseFell();
            }),
        );
    }

    // async waitAndBlock(ms: number): Promise<void> {
    //     await new Promise<void>((resolve) => setTimeout(resolve, ms));
    // }
}
