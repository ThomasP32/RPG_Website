import { GameCreationService } from '@app/socket/game/service/game-creation/game-creation.service';
import { Game, Player } from '@common/game';
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

    @SubscribeMessage('joinGame')
    handleJoinGame(client: Socket, data: { player: Player; gameId: string }): void {
        if (this.gameCreationService.doesGameExist(data.gameId)) {
            let game = this.gameCreationService.getGame(data.gameId);
            if (game.isLocked) {
                client.emit('gameLocked', { reason: 'La partie est vérouillée, veuillez réessayer plus tard.' });
                return;
            } else if (this.gameCreationService.isMaxPlayersReached(game.players, data.gameId)) {
                client.emit('gameLocked', { reason: "La salle d'attente de la partie est pleine." });
                return;
            }
            game = this.gameCreationService.addPlayerToGame(data.player, data.gameId);
            const newPlayer = game.players.filter((player) => player.socketId === client.id)[0];
            client.emit('youJoined', { newPlayer: newPlayer });
            this.server.to(data.gameId).emit('playerJoined', { name: newPlayer.name, game: game });
            this.server.to(data.gameId).emit('currentPlayers', game.players);
        } else {
            client.emit('gameNotFound', { reason: 'La partie a été fermée' });
        }
    }

    @SubscribeMessage('getPlayers')
    getAvailableAvatars(client: Socket, gameId: string): void {
        if (this.gameCreationService.doesGameExist(gameId)) {
            const game = this.gameCreationService.getGame(gameId);
            client.emit(
                'currentPlayers',
                game.players.filter((player) => player.isActive),
            );
        } else {
            client.emit('gameNotFound', { reason: 'La partie a été fermée' });
        }
    }

    @SubscribeMessage('accessGame')
    handleAccessGame(client: Socket, gameId: string): void {
        if (this.gameCreationService.doesGameExist(gameId)) {
            const game = this.gameCreationService.getGame(gameId);

            if (game.hasStarted) {
                client.emit('gameLocked', { reason: "Vous n'avez pas été assez rapide...\nLa partie a déjà commencé." });
                return;
            } else if (game.isLocked) {
                client.emit('gameLocked', { reason: 'La partie est vérouillée, veuillez réessayer plus tard.' });
                return;
            }
            client.join(gameId);
            client.emit('gameAccessed');
        } else {
            client.emit('gameNotFound', { reason: 'Le code est invalide, veuillez réessayer.' });
        }
    }

    @SubscribeMessage('initializeGame')
    async handleInitGame(client: Socket, roomId: string): Promise<void> {
        if (this.gameCreationService.doesGameExist(roomId)) {
            const game = this.gameCreationService.getGame(roomId);
            if (game && client.id === game.hostSocketId) {
                this.gameCreationService.initializeGame(roomId);
                const sockets = await this.server.in('room1').fetchSockets();
                sockets.forEach((socket) => {
                    if (game.players.every((player) => player.socketId !== socket.id)) {
                        socket.emit('gameAlreadyStarted', { reason: "La partie a commencée. Vous serez redirigé à la page d'acceuil" });
                        socket.leave(roomId);
                    }
                });
                this.server.to(roomId).emit('gameInitialized', { game: game });
            }
        } else {
            client.emit('gameNotFound');
        }
    }

    @SubscribeMessage('ifStartable')
    isStartable(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGame(gameId);
        if (client.id === game.hostSocketId) {
            if (this.gameCreationService.isGameStartable(gameId)) {
                client.emit('isStartable', { game: game });
            } else {
                return;
            }
        }
    }

    handleDisconnect(client: Socket): void {
        const games = this.gameCreationService.getGames();
        games.forEach((game) => {
            if (this.gameCreationService.isPlayerHost(client.id, game.id)) {
                this.server.to(game.id).emit('gameClosed', { reason: "L'organisateur a quitté la partie" });
                this.gameCreationService.deleteRoom(game.id);
                this.server.socketsLeave(game.id);
                return;
            } else if (game.players.some((player) => player.socketId === client.id)) {
                game = this.gameCreationService.handlePlayerDisconnect(client, game.id);
                this.server.to(game.id).emit('playerLeft', { playerId: client.id });
                return;
            } else {
                return;
            }
        });
    }
}
