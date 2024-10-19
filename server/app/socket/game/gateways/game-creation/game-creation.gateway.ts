import { GameCreationService } from '@app/socket/game/service/game-creation/game-creation.service';
import { Game } from '@common/game';
import { Inject } from '@nestjs/common';
import { OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class GameGateway implements OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    @Inject(GameCreationService) private gameCreationService: GameCreationService;

    @SubscribeMessage('startGame')
    handleStartGame(client: Socket, newGame: Game): void {
        client.join(newGame.id);
        newGame.hostSocketId = client.id;
        this.gameCreationService.addGame(newGame);
        this.server.to(newGame.id).emit('gameStarted', { game: newGame });
    }

    @SubscribeMessage('createMockGames')
    handleCreateMockGames(client: Socket): void {
        this.gameCreationService.createMockGames();
        client.emit('mockGamesCreated', { reason: 'Mock games created' });
        console.log('Mock games created');
    }

    @SubscribeMessage('joinGame')
    handleJoinGame(client: Socket, data: string): void {
        console.log(data);
        console.log(data);
        if (this.gameCreationService.doesGameExist(data)) {
            const game = this.gameCreationService.getGamebyId(data);
            if (game.isLocked) {
                client.emit('gameLocked', { reason: 'La partie est vérouillée, veuillez réessayer plus tard.' });
                return;
            }
            client.join(data);
            // this.gameCreationService.addPlayerToGame(data.player, data.gameId);
            this.server.to(data).emit('playerJoined', { game: game });
        } else {
            client.emit('gameNotFound', { reason: 'Le code est invalide, veuillez réessayer.' });
        }
    }

    handleConnection(client: Socket): void {
        console.log(`Connexion par l'utilisateur avec id : ${client.id}`);
    }

    handleDisconnect(client: Socket): void {
        const gameRooms = Array.from(client.rooms).filter((roomId) => roomId !== client.id);
        for (const gameId of gameRooms) {
            if (this.gameCreationService.isPlayerHost(client.id, gameId)) {
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
