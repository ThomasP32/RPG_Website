import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Game, GameCtf, Player } from '@common/game';
import { Map, Mode } from '@common/map.types';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    game: Game;

    constructor(
        private readonly socketService: SocketService,
        private readonly playerService: PlayerService,
    ) {
        this.socketService = socketService;
        this.playerService = playerService;
    }

    setGame(newGame: Game): void {
        this.game = newGame;
    }

    createNewCtfGame(map: Map, gameId: string): GameCtf {
        return {
            ...map,
            id: gameId,
            players: [this.playerService.player],
            hostSocketId: '',
            currentTurn: 0,
            nDoorsManipulated: [],
            duration: 0,
            nTurns: 0,
            debug: false,
            isLocked: false,
            hasStarted: false,
            nPlayersCtf: 0,
            mode: Mode.Ctf,
        };
    }

    createNewGame(map: Map, gameId: string): Game {
        return {
            ...map,
            id: gameId,
            players: [this.playerService.player],
            hostSocketId: '',
            currentTurn: 0,
            nDoorsManipulated: [],
            duration: 0,
            nTurns: 0,
            debug: false,
            isLocked: false,
            hasStarted: false,
        };
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
