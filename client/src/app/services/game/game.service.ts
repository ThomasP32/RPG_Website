import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
// import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Game, Player } from '@common/game';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    game: Game;
    // currentPlayerTurn: string;
    // activePlayers: Player[] = [];
    // map: Map;

    constructor(
        private socketService: SocketService,
        private playerService: PlayerService,
        // private gameTurnService: GameTurnService,
    ) {
        this.socketService = socketService;
        this.playerService = playerService;
        // this.gameTurnService = gameTurnService;
    }

    setGame(newGame: Game): void {
        this.game = newGame;
    }

    // setActivePlayers(players: Player[]): void {
    //     this.activePlayers = players;
    // }

    // listen to gameData ne devrait meme pas servir si l'initialisation est bien faite.

    listenToGameData(): void {
        this.socketService.listen<Game>('currentGame').subscribe((game: Game) => {
            if (game) {
                if (this.playerService.player.socketId === this.game.hostSocketId) {
                    this.socketService.sendMessage('startGame', this.game.id);
                }
            }
        });
    }

    listenPlayerData(): void {
        this.socketService.listen<Player[]>('currentPlayers').subscribe((players: Player[]) => {
            if (players && players.length > 0) {
                this.game.players = players;
                this.playerService.setPlayer(players.filter((player) => player.socketId === this.playerService.player.socketId)[0]);
            } else {
                console.error('Failed to load players or no players available');
            }
        });
    }

    // listenPlayersLeft() {
    //     this.socketService.listen<Player[]>('playerLeft').subscribe((players: Player[]) => {
    //         this.activePlayers = players.filter((player) => player.isActive);
    //     });
    // }



    // disconnect(): void {
    //     this.socketService.disconnect();
    // }

    // leaveGame(gameId: string, playerId: string): void {
    //     this.socketService.sendMessage('leaveGame', { gameId, playerId });
    // }

    // listenToGameUpdates(): Observable<Game> {
    //     return this.socketService.listen<Game>('gameUpdate').pipe(
    //         map((updatedGame) => {
    //             this.game = updatedGame;
    //             this.updateCurrentTurn();
    //             this.updatePlayerAttributes();
    //             return updatedGame;
    //         }),
    //         catchError((error) => {
    //             console.error('Error in game updates');
    //             return rxjsThrowError(() => error);
    //         })
    //     );
    // }

    // listenToMapUpdates(): Observable<Map> {
    //     return this.socketService.listen<Map>('mapUpdate').pipe(
    //         map((updatedMap) => {
    //             this.map = updatedMap;
    //             return updatedMap;
    //         }),
    //         catchError((error) => {
    //             console.error('Error in map updates');
    //             return rxjsThrowError(() => error);
    //         })
    //     );
    // }

    // private updateCurrentTurn(): void {
    //     this.currentPlayerTurn = this.game.players.find((player) => player.turn === this.game.currentTurn) || ({} as Player);
    // }

    // private updatePlayerAttributes(): void {
    //     if (this.currentPlayerTurn) {
    //         this.currentPlayerTurn.specs = this.currentPlayerTurn.specs || {
    //             life: 0,
    //             speed: 0,
    //             attack: 0,
    //             defense: 0,
    //             movePoints: 0,
    //             actions: 0,
    //         };
    //         this.currentPlayerTurn.specs = {
    //             ...this.currentPlayerTurn.specs,
    //             life: this.currentPlayerTurn.specs.life,
    //             speed: this.currentPlayerTurn.specs.speed,
    //             attack: this.currentPlayerTurn.specs.attack,
    //             defense: this.currentPlayerTurn.specs.defense,
    //             movePoints: this.currentPlayerTurn.specs.movePoints,
    //             actions: this.currentPlayerTurn.specs.actions,
    //         };
    //     }
    // }
}
