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
            }
            game = this.gameCreationService.addPlayerToGame(data.player, data.gameId);
            console.log(game);
            this.server.to(data.gameId).emit('playerJoined', { name: data.player.name, game: game });
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

    @SubscribeMessage('combatPlayer')
    getCombatPlayer(client: Socket, data: { player: Player; gameId: string }): void {
        if (this.gameCreationService.doesGameExist(data.gameId)) {
            const game = this.gameCreationService.getGame(data.gameId);
            client.emit('currentCombatPlayer', { player: data.player, game: game });
        } else {
            client.emit('combatPlayerNotFound', { reason: 'Le joueur ayant commencé le combat pas trouvé' });
        }
    }

    @SubscribeMessage('accessGame')
    handleAccessGame(client: Socket, gameId: string): void {
        if (this.gameCreationService.doesGameExist(gameId)) {
            const game = this.gameCreationService.getGame(gameId);
            // const numClientsInRoom = this.server.sockets.adapter?.rooms?.get(gameId)?.size || 0;
            if (game.hasStarted) {
                client.emit('gameLocked', { reason: 'La partie a déjà commencé.' });
                return;
            } else if (game.isLocked) {
                client.emit('gameLocked', { reason: 'La partie est vérouillée, veuillez réessayer plus tard.' });
                return;
            }
            // else if (this.gameCreationService.isMaxPlayersReached(numClientsInRoom, gameId)) {
            //     client.emit('gameLocked', { reason: 'Le jeu a atteint un nombre de joueur maximal, essayez plus tard.' });
            //     return;
            // }
            client.join(gameId);
            client.emit('gameAccessed');
        } else {
            client.emit('gameNotFound', { reason: 'Le code est invalide, veuillez réessayer.' });
        }
    }

    @SubscribeMessage('initializeGame')
    handleInitGame(client: Socket, roomId: string): void {
        if (this.gameCreationService.doesGameExist(roomId)) {
            const game = this.gameCreationService.getGame(roomId);
            if (game && client.id === game.hostSocketId) {
                this.gameCreationService.initializeGame(roomId);
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
    @SubscribeMessage('playerDisconnected')
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
