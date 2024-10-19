import { GameCreationService } from '@app/socket/game/service/game-creation/game-creation.service';
import { Avatar, Game, Player } from '@common/game';
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
    handleJoinGame(client: Socket, gameId: string): void {
        console.log(gameId);
        if (this.gameCreationService.doesGameExist(gameId)) {
            console.log('la partie existe');
            const game = this.gameCreationService.getGamebyId(gameId);
            if (game.isLocked) {
                console.log('la partie est verrouillée');
                client.emit('gameLocked', { reason: 'La partie est vérouillée, veuillez réessayer plus tard.' });
                return;
            }
            console.log('va creer ton perso');
            client.emit('gameJoined');
            client.join(gameId);
            // this.gameCreationService.addPlayerToGame(data.player, data.gameId);
            this.server.to(gameId).emit('playerJoined', { game: game });
        } else {
            client.emit('gameNotFound', { reason: 'Le code est invalide, veuillez réessayer.' });
        }
    }

    @SubscribeMessage('addPlayerToGame')
    handleAddPlayerToGame(client: Socket, data: { player: Player; gameId: string }): void {
        const game = this.gameCreationService.addPlayerToGame(data.player, data.gameId);
        client.to(data.gameId).emit('playerJoined', { game: game });
    }
    @SubscribeMessage('characterInit')
    handleSettingAvatars(client: Socket, data: { gameId: string }): void {
        const game = this.gameCreationService.getGamebyId(data.gameId);
        console.log(game.availableAvatars);
        if (game.availableAvatars.length > 0) {
            console.log('characterInitialized');
            const avatars = game.availableAvatars;
            client.emit('characterInitialized', { avatars: avatars, gameName: game.name });
        } else {
            client.emit('characterInitialized', { avatars: [], gameName: game.name });
        }
    }

    @SubscribeMessage('selectAvatar')
    handleSelectAvatar(client: Socket, data: { avatar: Avatar }): void {
        const gameId = Array.from(client.rooms).find((roomId) => roomId !== client.id);
        const game = this.gameCreationService.getGamebyId(gameId);
        game.availableAvatars.push(data.avatar);
        client.to(gameId).emit('avatarSelected', { avatar: data.avatar });
    }

    @SubscribeMessage('deselectAvatar')
    handleDeselectAvatar(client: Socket, data: { avatar: Avatar }): void {
        const gameId = Array.from(client.rooms).find((roomId) => roomId !== client.id);
        client.to(gameId).emit('avatarDeselected', { avatar: data.avatar });
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
