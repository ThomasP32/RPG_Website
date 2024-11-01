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

    @SubscribeMessage('createGame')
    handleCreateGame(client: Socket, newGame: Game): void {
        client.join(newGame.id);
        newGame.hostSocketId = client.id;
        this.gameCreationService.addGame(newGame);

        this.server.to(newGame.id).emit('gameCreated', { game: newGame });
    }

    @SubscribeMessage('joinGame')
    handleJoinGame(client: Socket, data: { player: Player; gameId: string }): void {
        if (this.gameCreationService.doesGameExist(data.gameId)) {
            let game = this.gameCreationService.getGameById(data.gameId);
            if (game.isLocked) {
                client.emit('gameLocked', { reason: 'La partie est vérouillée, veuillez réessayer plus tard.' });
                return;
            }
            game = this.gameCreationService.addPlayerToGame(data.player, data.gameId);
            if (this.gameCreationService.isMaxPlayersReached(game.players, data.gameId)) {
                this.gameCreationService.lockGame(data.gameId);
            }
            const newPlayer = game.players.filter((player) => player.socketId === client.id)[0];
            client.emit('youJoined', newPlayer);
            this.server.to(data.gameId).emit('playerJoined', game.players);
            this.server.to(data.gameId).emit('currentPlayers', game.players);
        } else {
            client.emit('gameNotFound', { reason: 'La partie a été fermée' });
        }
    }

    @SubscribeMessage('getPlayers')
    getAvailableAvatars(client: Socket, gameId: string): void {
        if (this.gameCreationService.doesGameExist(gameId)) {
            const game = this.gameCreationService.getGameById(gameId);
            client.emit(
                'currentPlayers',
                game.players.filter((player) => player.isActive),
            );
        } else {
            client.emit('gameNotFound', { reason: 'La partie a été fermée' });
        }
    }

    @SubscribeMessage('kickPlayer')
    handleKickPlayer(client: Socket, playerId: string): void {
        this.server.to(playerId).emit('playerKicked');
    }

    @SubscribeMessage('getGameData')
    getGame(client: Socket, gameId: string): void {
        if (this.gameCreationService.doesGameExist(gameId)) {
            const game = this.gameCreationService.getGameById(gameId);
            console.log('Game data:', game);
            client.emit('currentGameData', { game: game, name: game.name, size: game.mapSize.x });
        } else {
            client.emit('gameNotFound', { reason: 'La partie a été fermée' });
        }
    }

    @SubscribeMessage('accessGame')
    handleAccessGame(client: Socket, gameId: string): void {
        if (this.gameCreationService.doesGameExist(gameId)) {
            const game = this.gameCreationService.getGameById(gameId);

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
            const game = this.gameCreationService.getGameById(roomId);
            if (game && client.id === game.hostSocketId) {
                this.gameCreationService.initializeGame(roomId);
                const sockets = await this.server.in(roomId).fetchSockets();
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

    @SubscribeMessage('toggleGameLockState')
    handleToggleGameLockState(client: Socket, data: { isLocked: boolean; gameId: string }): void {
        const game = this.gameCreationService.getGameById(data.gameId);
        if (game && game.hostSocketId === client.id) {
            game.isLocked = data.isLocked;
            this.server.to(game.id).emit('gameLockToggled', { isLocked: game.isLocked });
        }
    }

    @SubscribeMessage('ifStartable')
    isStartable(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        if (game && client.id === game.hostSocketId) {
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
            if (!game.hasStarted) {
                if (this.gameCreationService.isPlayerHost(client.id, game.id)) {
                    this.server.to(game.id).emit('gameClosed', { reason: "L'organisateur a quitté la partie" });
                    this.gameCreationService.deleteRoom(game.id);
                    // this.server.socketsLeave(game.id);

                    return;
                }
            }
            if (game.players.some((player) => player.socketId === client.id)) {
                game = this.gameCreationService.handlePlayerDisconnect(client, game.id);
                this.server.to(game.id).emit('playerLeft', game.players);
                return;
            } else {
                return;
            }
        });
    }
}
