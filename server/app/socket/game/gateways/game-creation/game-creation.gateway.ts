import { GameCreationService } from '@app/socket/game/service/game-creation/game-creation.service';
import { GameRoom, Player } from '@common/game';
import { Inject } from '@nestjs/common';
import { OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/game', cors: true })
export class GameGateway implements OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    @Inject(GameCreationService) private gameCreationService: GameCreationService;

    @SubscribeMessage('startGame')
    handleStartGame(client: Socket, newGame: GameRoom): void {
        client.join(newGame.id);
        newGame.hostSocketId = client.id;
        this.gameCreationService.addGame(newGame);
        this.server.to(newGame.id).emit('gameStarted', { game: newGame });
    }

    @SubscribeMessage('joinGame')
    handleJoinGame(client: Socket, data: { player: Player; gameId: string }): void {
        client.join(data.gameId);
        const game = this.gameCreationService.addPlayerToGame(data.player, data.gameId);
        this.server.to(data.gameId).emit('playerJoined', { name: data.player.name, game: game });
    }

    handleDisconnect(client: Socket): void {
        const gameRooms = client.rooms;
        for (const gameId of gameRooms) {
            if (this.gameCreationService.isPlayerHost(client.id, gameId)) {
                console.log(`Admin ${client.id} left. Closing game with code ${gameId}`);
                this.server.to(gameId).emit('gameClosed', { reason: "L'organisateur a quitté la partie" });
                this.gameCreationService.deleteRoom(gameId);
                this.server.socketsLeave(gameId);
            } else {
                const updatedGame = this.gameCreationService.handlePlayerDisconnect(client);
                this.server.to(gameId).emit('updateGame', { game: updatedGame });
                this.server.to(gameId).emit('playerLeft', { playerId: client.id });
            }
        }
    }
}
