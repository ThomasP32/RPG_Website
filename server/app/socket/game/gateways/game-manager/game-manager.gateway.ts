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
    getMoves(client: Socket, data: { playerName: string; gameId: string }): void {
        if (!this.gameCreationService.doesGameExist(data.gameId)) {
            client.emit('gameNotFound');
            return;
        }
        this.gameCreationService.getGame(data.gameId);
        const moves = this.gameManagerService.getMoves(data.gameId, data.playerName);
        client.emit('playerPossibleMoves', { moves: moves });
    }

    @SubscribeMessage('previewMove')
    getPreviewMove(client: Socket, data: { playerName: string; gameId: string; position: Coordinate }): void {
        if (!this.gameCreationService.doesGameExist(data.gameId)) {
            client.emit('gameNotFound');
            return;
        }
        this.gameCreationService.getGame(data.gameId);
        const moves = this.gameManagerService.getMove(data.gameId, data.playerName, data.position, true);
        client.emit('playerPossibleMove', { moves: moves });
    }

    @SubscribeMessage('moveToPosition')
    getMove(client: Socket, data: { playerName: string; gameId: string; position: Coordinate }): void {
        if (!this.gameCreationService.doesGameExist(data.gameId)) {
            client.emit('gameNotFound');
            return;
        }
        this.gameCreationService.getGame(data.gameId);
        const moves = this.gameManagerService.getMove(data.gameId, data.playerName, data.position, false);
        if (moves.length === 0) {
            client.emit('tileUnreachable');
            return;
        }
        moves.forEach((move) => {
            this.gameManagerService.updatePosition(data.gameId, data.playerName, move);
            this.server.to(data.gameId).emit('playerMoved', { playerName: data.playerName, position: move });
        });
        this.gameManagerService.updateTurnCounter(data.gameId);
        this.server.to(data.gameId).emit('playerFinishedMoving', { game: this.gameCreationService.getGame(data.gameId) });
    }
}
