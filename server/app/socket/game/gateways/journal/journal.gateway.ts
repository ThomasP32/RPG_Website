import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class JournalGateway {
    @WebSocketServer() server: Server;

    // @SubscribeMessage('startTurn')
    // handleStartTurn(client: Socket, data: { gameId: string }): void {
    //     this.server.to(data.gameId).emit('startTurn', { gameId: data.gameId });
    // }
    // @SubscribeMessage('startCombat')
    // handleStartCombat(client: Socket, data: { gameId: string; players: string[] }): void {
    //     this.server.to(data.gameId).emit('startCombat', { gameId: data.gameId, players: data.players });
    // }
    // @SubscribeMessage('endCombat')
    // handleEndCombat(client: Socket, data: { gameId: string; winner: string }): void {
    //     this.server.to(data.gameId).emit('endCombat', { gameId: data.gameId, winner: data.winner });
    // }
    // @SubscribeMessage('openDoor')
    // handleOpenDoor(client: Socket, data: { gameId: string; playerName: string }): void {
    //     this.server.to(data.gameId).emit('openDoor', { gameId: data.gameId, playerName: data.playerName });
    // }
    // @SubscribeMessage('closeDoor')
    // handleCloseDoor(client: Socket, data: { gameId: string; playerName: string }): void {
    //     this.server.to(data.gameId).emit('closeDoor', { gameId: data.gameId, playerName: data.playerName });
    // }
    // @SubscribeMessage('endGame')
    // handleEndGame(client: Socket, data: { gameId: string; winner: string }): void {
    //     this.server.to(data.gameId).emit('endGame', { gameId: data.gameId, winner: data.winner });
    // }
    // @SubscribeMessage('playerDisconnected')
    // handlePlayerAbandonGame(client: Socket, data: { gameId: string; playerName: string }): void {
    //     this.server.to(data.gameId).emit('playerDisconnected', { playerName: data.playerName, gameId: data.gameId });
    // }
}
