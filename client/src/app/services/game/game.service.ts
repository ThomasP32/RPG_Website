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

    constructor(
        private socketService: SocketService,
        private playerService: PlayerService,
    ) {
        this.socketService = socketService;
        this.playerService = playerService;
    }

    setGame(newGame: Game): void {
        this.game = newGame;
    }

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
}
