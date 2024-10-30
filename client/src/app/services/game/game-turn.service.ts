import { Injectable } from '@angular/core';
import { PlayerService } from '@app/services/player-service/player.service';
import { Game, Player } from '@common/game';
import { Coordinate } from '@common/map.types';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';

@Injectable({
    providedIn: 'root',
})
export class GameTurnService {
    game: Game;
    player: Player;
    socketSubscription: Subscription = new Subscription();
    moves: Coordinate[] = [];
    movePreview: Coordinate[] = [];
    private playerTurn = new BehaviorSubject<string>('');
    public playerTurn$ = this.playerTurn.asObservable();

    constructor(
        private playerService: PlayerService,
        private socketService: SocketService,
    ) {
        this.playerService = playerService;
        this.socketService = socketService;
        console.log('GameTurnService est instancié');
        this.player = this.playerService.getPlayer();
        this.listenForTurn();
    }

    startTurn(): void {
        setTimeout(() => this.getMoves(), 3000);
    }

    endTurn(): void {
        this.socketService.sendMessage('endTurn', this.game.id);
    }

    listenForTurn() {
        this.socketSubscription.add(
            this.socketService.listen('yourTurn').subscribe(() => {
                this.playerTurn.next(this.player.name);
                this.startTurn();
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<string>('playerTurn').subscribe((playerName) => {
                this.moves = [];
                this.playerTurn.next(playerName);
            }),
        );
    }

    listenForTurnRotation() {
        this.socketSubscription.add(
            this.socketService.listen<Game>('playerFinishedTurn').subscribe((game) => {
                this.game = game;
            }),
        );
    }

    getMoves() {
        this.listenMoves();
        this.socketService.sendMessage('getMovements', { playerName: this.player.name, gameId: this.game.id });
    }

    listenMoves() {
        this.socketSubscription.add(
            this.socketService.listen<Coordinate[]>('playerPossibleMoves').subscribe((moves) => {
                this.moves = moves;
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<Coordinate[]>('playerPossibleMove').subscribe((movePreview) => {
                console.log('son preview ', this.movePreview);
                this.movePreview = movePreview;
            }),
        );
    }
}
