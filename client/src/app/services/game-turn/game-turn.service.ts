import { Injectable } from '@angular/core';
import { MovesMap } from '@app/interfaces/moves';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { TIME_LIMIT_DELAY } from '@common/constants';
import { Game, Player } from '@common/game';
import { Coordinate, DoorTile } from '@common/map.types';
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

    private possibleOpponents = new BehaviorSubject<Player[]>([]);
    public possibleOpponents$ = this.possibleOpponents.asObservable();

    private possibleDoors = new BehaviorSubject<DoorTile[]>([]);
    public possibleDoors$ = this.possibleDoors.asObservable();

    isMoving = false;

    actionsDone = { combat: false, door: false };
    possibleActions = { combat: false, door: false };

    constructor(
        private gameService: GameService,
        private playerService: PlayerService,
        private socketService: SocketService,
    ) {
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
        this.getMoves();
        this.getActions();
    }

    resumeTurn(): void {
        if (this.playerTurn.getValue() === this.player.name) {
            if (!this.actionsDone.door || !this.actionsDone.combat) {
                this.getActions();
            }
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
        }, TIME_LIMIT_DELAY);
    }

    listenForTurn() {
        this.socketSubscription.add(
            this.socketService.listen<Player>('yourTurn').subscribe((yourPlayer) => {
                this.clearMoves();
                this.actionsDone.door = false;
                this.actionsDone.combat = false;
                this.playerService.player = yourPlayer;
                this.playerTurn.next(yourPlayer.name);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<string>('playerTurn').subscribe((playerName) => {
                this.clearMoves();
                this.youFell.next(false);
                this.playerTurn.next(playerName);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen('startTurn').subscribe(() => {
                if (this.playerTurn.getValue() === this.player.name) {
                    this.getActions();
                }
            }),
        );
    }

    getActions(): void {
        this.listenForPossibleCombats();
        this.listenForDoors();
        this.socketService.sendMessage('getCombats', this.game.id);
        this.socketService.sendMessage('getAdjacentDoors', this.game.id);
    }

    getMoves(): void {
        this.socketService.sendMessage('getMovements', this.game.id);
    }

    clearMoves(): void {
        this.moves = new Map();
    }

    movePlayer(position: Coordinate) {
        this.socketService.sendMessage('moveToPosition', { playerTurn: this.player.turn, gameId: this.game.id, destination: position });
    }

    listenMoves(): void {
        this.socketSubscription.add(
            this.socketService.listen<[string, { path: Coordinate[]; weight: number }][]>('playerPossibleMoves').subscribe((paths) => {
                this.moves = new Map();
                this.moves = new Map(paths);
                if (this.moves.size === 1 && !this.possibleActions.combat) {
                    this.endTurn();
                }
            }),
        );
    }

    toggleDoor(door: DoorTile) {
        if (this.possibleActions.door && !this.actionsDone.door) {
            this.socketService.sendMessage('toggleDoor', { gameId: this.game.id, door });
        }
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

    listenForDoorUpdates(): void {
        this.socketService.listen<{ game: Game; player: Player }>('doorToggled').subscribe((data) => {
            this.actionsDone.door = true;
            if (data.player && data.player.socketId === this.player.socketId) {
                this.playerService.setPlayer(data.player);
            }
            this.gameService.setGame(data.game);
            this.resumeTurn();
        });
    }
    listenForCombatStarted(): void {
        this.socketSubscription.add(
            this.socketService.listen<Player>('YouStartedCombat').subscribe((player) => {
                if (player.socketId === this.player.socketId) {
                    this.playerService.setPlayer(player);
                }
            }),
        );
    }

    listenForPossibleCombats(): void {
        this.socketSubscription.add(
            this.socketService.listen<Player[]>('yourCombats').subscribe((possibleOpponents) => {
                if (possibleOpponents.length === 0) {
                    this.possibleActions.combat = false;
                } else {
                    this.possibleActions.combat = true;
                }
                this.possibleOpponents.next(possibleOpponents);
                this.getMoves();
            }),
        );
    }

    listenForDoors(): void {
        this.socketSubscription.add(
            this.socketService.listen<DoorTile[]>('yourDoors').subscribe((possibleDoors) => {
                if (possibleDoors.length === 0) {
                    this.possibleActions.door = false;
                } else {
                    this.possibleActions.door = true;
                }
                this.possibleDoors.next(possibleDoors);
            }),
        );
    }

    listenForCombatConclusion(): void {
        this.socketSubscription.add(
            this.socketService.listen<{ updatedGame: Game; evadingPlayer: Player }>('combatFinishedByEvasion').subscribe((data) => {
                if (data.evadingPlayer.socketId === this.player.socketId) {
                    this.playerService.player = data.evadingPlayer;
                } else {
                    this.playerService.player = data.updatedGame.players.filter((player) => (player.socketId = this.player.socketId))[0];
                }
                this.gameService.setGame(data.updatedGame);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ updatedGame: Game; winner: Player }>('combatFinished').subscribe((data) => {
                if (data.winner.socketId === this.player.socketId) {
                    this.playerService.player = data.winner;
                } else {
                    this.playerService.player = data.updatedGame.players.filter((player) => (player.socketId = this.player.socketId))[0];
                }
                this.gameService.setGame(data.updatedGame);
            }),
        );
    }

    listenForFlagDetentor(): void {
        this.socketSubscription.add(
            this.socketService.listen<Game>('flagPickedUp').subscribe((game) => {
                this.gameService.setGame(game);
            }),
        );
    }
}
