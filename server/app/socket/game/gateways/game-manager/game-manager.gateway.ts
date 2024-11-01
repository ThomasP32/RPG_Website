import { GameCreationService } from '@app/socket/game/service/game-creation/game-creation.service';
import { GameManagerService } from '@app/socket/game/service/game-manager/game-manager.service';
import { Coordinate } from '@common/map.types';
import { Inject } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class GameManagerGateway {
    @WebSocketServer()
    server: Server;

    @Inject(GameCreationService) private gameCreationService: GameCreationService;
    @Inject(GameManagerService) private gameManagerService: GameManagerService;

    @SubscribeMessage('getMovements')
    getMoves(client: Socket, gameId: string): void {
        if (!this.gameCreationService.doesGameExist(gameId)) {
            client.emit('gameNotFound');
            return;
        }
        const moves = this.gameManagerService.getMoves(gameId, client.id);
    }

    @SubscribeMessage('moveToPosition')
    async getMove(client: Socket, data: { gameId: string; destination: Coordinate }): Promise<void> {
        let wasOnIceTile = false;
        if (!this.gameCreationService.doesGameExist(data.gameId)) {
            client.emit('gameNotFound');
            return;
        }
        const game = this.gameCreationService.getGameById(data.gameId);
        const player = game.players.filter((player) => player.socketId === client.id)[0];
        const moves = this.gameManagerService.getMove(data.gameId, client.id, data.destination);
        if (this.gameManagerService.onIceTile(player, game.id)) {
            wasOnIceTile = true;
        }

        if (moves.length === 0) {
            return;
        }

        moves.shift();

        for (const move of moves) {
            this.gameManagerService.updatePosition(data.gameId, client.id, [move]);

            const isOnIceTile = this.gameManagerService.onIceTile(player, game.id);
            if (isOnIceTile && !wasOnIceTile) {
                player.specs.attack -= 2;
                player.specs.defense -= 2;
                wasOnIceTile = true;
            } else if (!isOnIceTile && wasOnIceTile) {
                player.specs.attack += 2;
                player.specs.defense += 2;
                wasOnIceTile = false;
            }
            this.server.to(data.gameId).emit('positionToUpdate', { game: game, player: player });
            await new Promise((resolve) => setTimeout(resolve, 150));
        }

        if (this.gameManagerService.hasFallen(moves, data.destination)) {
            this.server.to(client.id).emit('youFell');
        } else {
            this.server.to(client.id).emit('youFinishedMoving');
        }
    }

    @SubscribeMessage('isGameFinished')
    isGameFinished(gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        if (game.players.length === 1 && game.hasStarted) {
            this.server.to(gameId).emit('gameFinishedNoWin', { winner: game.players[0] });
        }
    }

    @SubscribeMessage('hasPlayerWon')
    hasPlayerWon(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        game.players.forEach((player) => {
            if (player.specs.nVictories >= 3) {
                this.server.to(gameId).emit('playerWon', { winner: player });
            }
        });
    }

    @SubscribeMessage('startGame')
    startGame(client: Socket, gameId: string): void {
        this.startTurn(gameId);
    }

    @SubscribeMessage('endTurn')
    endTurn(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        const player = game.players.find((player) => player.turn === game.currentTurn);
        if (player.socketId !== client.id) {
            return;
        }

        player.specs.movePoints = player.specs.speed;
        this.gameManagerService.updateTurnCounter(gameId);
        this.startTurn(gameId);
    }

    startTurn(gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        const activePlayer = game.players.find((player) => player.turn === game.currentTurn);

        if (!activePlayer || !activePlayer.isActive) {
            game.currentTurn++;
            this.startTurn(gameId);
            return;
        }

        activePlayer.specs.movePoints = activePlayer.specs.speed;

        this.server.to(activePlayer.socketId).emit('yourTurn', activePlayer);

        game.players
            .filter((player) => player.socketId !== activePlayer.socketId)
            .forEach((player) => {
                if (player.socketId !== activePlayer.socketId) {
                    this.server.to(player.socketId).emit('playerTurn', activePlayer.name);
                }
            });
    }
}
