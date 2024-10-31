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
        console.log('on a demandé les mouvements');
        const moves = this.gameManagerService.getMoves(gameId, client.id);
        client.emit('playerPossibleMoves', moves);
        console.log('on lui a envoyé ses mouvements', moves);
    }

    @SubscribeMessage('moveToPosition')
    getMove(client: Socket, data: { gameId: string; destination: Coordinate }): void {
        if (!this.gameCreationService.doesGameExist(data.gameId)) {
            client.emit('gameNotFound');
            return;
        }
        const game = this.gameCreationService.getGameById(data.gameId);
        let hasFell = false;
        const player = game.players.filter((player) => player.socketId === client.id)[0];
        const moves = this.gameManagerService.getMove(data.gameId, client.id, data.destination);

        if (moves.length === 0) {
            return;
        }

        if (moves[moves.length - 1].x !== data.destination.x || moves[moves.length - 1].y !== data.destination.y) {
            hasFell = true;
        }

        this.gameManagerService.updatePosition(data.gameId, client.id, moves);

        this.server.to(data.gameId).emit('positionToUpdate', { player: player, path: moves });
        if (hasFell) {
            console.log("on ta envoyé youFell");
            this.server.to(client.id).emit('youFell', player);
        } else {
            this.server.to(client.id).emit('youFinishedMoving', player);
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
    hasPlayerWon(gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        game.players.forEach((player) => {
            if (player.specs.nVictories >= 3) {
                this.server.to(gameId).emit('playerWon', { winner: player });
            }
        });
    }

    @SubscribeMessage('startGame')
    startGame(client: Socket, gameId: string): void {
        console.log('on a recu le message de startGame pour la game ', gameId);
        this.startTurn(gameId);
    }

    @SubscribeMessage('endTurn')
    endTurn(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        const player = game.players.find((player) => player.turn === game.currentTurn);
        if (player.socketId !== client.id) {
            return;
        }
        if (this.gameManagerService.onIceTile(player, gameId)) {
            player.specs.attack -= 2;
            player.specs.defense -= 2;
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

        if (this.gameManagerService.onIceTile(activePlayer, gameId)) {
            activePlayer.specs.attack += 2;
            activePlayer.specs.defense += 2;
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
