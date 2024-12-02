import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { TIME_LIMIT_DELAY } from '@common/constants';
import { MovesMap } from '@common/directions';
import { CombatEvents, CombatFinishedByEvasionData, CombatFinishedData } from '@common/events/combat.events';
import { Game, Player } from '@common/game';
import { Coordinate, DoorTile, ItemCategory, Tile } from '@common/map.types';
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

    private possibleWalls = new BehaviorSubject<Tile[]>([]);
    public possibleWalls$ = this.possibleWalls.asObservable();

    isMoving = false;

    possibleActions = { combat: false, door: false, wall: false };

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

    resumeTurn(): void {
        if (this.playerTurn.getValue() === this.player.name) {
            this.possibleOpponents.next([]);
            this.possibleDoors.next([]);
            this.possibleActions.combat = true;
            this.possibleActions.door = true;

            if (this.player.specs.actions !== 0) {
                if (this.player.inventory.includes(ItemCategory.WallBreaker)) {
                    this.possibleActions.wall = true;
                    this.getWalls();
                }
                this.getCombats();
                this.getDoors();
            } else {
                this.getMoves();
            }
            this.gameService.setGame(this.game);
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
                    this.possibleActions.combat = true;
                    this.possibleActions.door = true;
                    if (this.player.inventory.includes(ItemCategory.WallBreaker)) {
                        this.possibleActions.wall = true;
                    }
                    this.getCombats();
                }
            }),
        );
    }

    getCombats(): void {
        this.socketService.sendMessage('getCombats', this.game.id);
    }

    getDoors(): void {
        this.socketService.sendMessage('getAdjacentDoors', this.game.id);
    }

    getWalls(): void {
        this.listenForWallBreaking();
        this.socketService.sendMessage('getAdjacentWalls', this.game.id);
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
                if (
                    this.moves.size === 1 &&
                    (this.playerService.player.specs.actions === 0 ||
                        (!this.possibleActions.combat && !this.possibleActions.door && !this.possibleActions.wall))
                ) {
                    this.endTurn();
                }
            }),
        );
    }

    toggleDoor(door: DoorTile) {
        if (this.possibleActions.door) {
            this.socketService.sendMessage('toggleDoor', { gameId: this.game.id, door });
            this.possibleActions.door = false;
        }
    }

    breakWall(wall: Tile) {
        if (this.possibleActions.wall) {
            this.socketService.sendMessage('breakWall', { gameId: this.game.id, wall });
            this.possibleActions.wall = false;
        }
    }

    listenForPlayerMove(): void {
        this.socketSubscription.add(
            this.socketService.listen<{ game: Game; player: Player }>('positionToUpdate').subscribe(async (data) => {
                if (data.player.socketId === this.player.socketId) {
                    this.playerService.setPlayer(data.player);
                }
                this.gameService.setGame(data.game);
                this.resumeTurn();
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

    listenForCombatStarted(): void {
        this.socketSubscription.add(
            this.socketService.listen<Player>(CombatEvents.YouStartedCombat).subscribe((player) => {
                if (player.socketId === this.player.socketId) {
                    this.playerService.setPlayer(player);
                }
            }),
        );
    }

    listenForPossibleActions(): void {
        this.socketSubscription.add(
            this.socketService.listen<Player[]>('yourCombats').subscribe((possibleOpponents) => {
                if (possibleOpponents.length === 0) {
                    this.possibleActions.combat = false;
                }
                this.possibleOpponents.next(possibleOpponents);
                this.getDoors();
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<DoorTile[]>('yourDoors').subscribe((possibleDoors) => {
                if (possibleDoors.length === 0) {
                    this.possibleActions.door = false;
                }
                this.possibleDoors.next(possibleDoors);
                this.getMoves();
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<Tile[]>('yourWalls').subscribe((possibleWalls) => {
                if (possibleWalls.length === 0) {
                    this.possibleActions.door = false;
                }
                this.possibleWalls.next(possibleWalls);
                this.getMoves();
            }),
        );
    }

    listenForWallBreaking(): void {
        this.socketService.listen<{ game: Game; player: Player }>('wallBroken').subscribe((data) => {
            if (data.player && data.player.socketId === this.player.socketId) {
                this.playerService.setPlayer(data.player);
                this.resumeTurn();
            }
            this.gameService.setGame(data.game);
        });
    }

    listenForDoorUpdates(): void {
        this.socketService.listen<{ game: Game; player: Player }>('doorToggled').subscribe((data) => {
            if (data.player && data.player.socketId === this.player.socketId) {
                this.playerService.setPlayer(data.player);
                this.resumeTurn();
            }
            this.gameService.setGame(data.game);
        });
    }

    listenForCombatConclusion(): void {
        this.socketSubscription.add(
            this.socketService.listen<CombatFinishedByEvasionData>(CombatEvents.CombatFinishedByEvasion).subscribe((data) => {
                if (data.evadingPlayer.socketId === this.player.socketId) {
                    this.playerService.setPlayer(data.evadingPlayer);
                    if (data.updatedGame.currentTurn === this.playerService.player.turn) {
                        this.clearMoves();
                        this.resumeTurn();
                    }
                } else {
                    this.playerService.setPlayer(data.updatedGame.players.filter((player) => (player.socketId = this.player.socketId))[0]);
                }
                this.gameService.setGame(data.updatedGame);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<CombatFinishedData>(CombatEvents.CombatFinished).subscribe((data) => {
                if (data.winner.socketId === this.playerService.player.socketId) {
                    this.playerService.setPlayer(data.winner);
                } else {
                    this.playerService.setPlayer(data.loser);
                }
                this.gameService.setGame(data.updatedGame);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen(CombatEvents.ResumeTurnAfterCombatWin).subscribe(() => {
                this.clearMoves();
                this.resumeTurn();
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

    listenForEndOfGame() {
        this.socketSubscription.add(
            this.socketService.listen<Player>(CombatEvents.GameFinishedPlayerWon).subscribe(() => {
                this.playerWon.next(true);
            }),
        );
        this.playerWon.next(false);
    }
}
