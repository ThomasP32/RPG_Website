import { GameCreationService } from '@app/socket/game/service/game-creation/game-creation.service';
import { GameManagerService } from '@app/socket/game/service/game-manager/game-manager.service';
import { Coordinate, TileCategory } from '@common/map.types';
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
    getMove(client: Socket, data: { playerName: string; gameId: string; destination: Coordinate }): void {
        if (!this.gameCreationService.doesGameExist(data.gameId)) {
            client.emit('gameNotFound');
            return;
        }
        this.gameCreationService.getGame(data.gameId);
        let hasFell = false;
        const moves = this.gameManagerService.getMove(data.gameId, data.playerName, data.destination, false);
        const player = this.gameCreationService.getGame(data.gameId).players.find((player) => player.name === data.playerName);
        if (moves.length === 0) {
            // on peut rajouter une gestion quelconque mais cest pas demandé
            return;
        }
        if (moves[moves.length - 1].x !== data.destination.x && moves[moves.length - 1].y !== data.destination.y) {
            // cas ou un joueur tombe sur une tuile de glace
            // la destination devient donc l'endroit ou il a fell
            data.destination = moves[moves.length - 1];
            hasFell = true;
        }
        // tous les joueurs doivent savoir quand un joueur bouge
        moves.forEach((move) => {
            this.gameManagerService.updatePosition(data.gameId, data.playerName, move);
            player.specs.movePoints -= 1;
            player.visitedTiles.push(move);
            setTimeout(() => this.server.to(data.gameId).emit('positionUpdated', { playerName: data.playerName, position: move }), 150);
        });
        // le joueur peut continuer à jouer s'il n'est pas tombé (combat ou mouvement)
        // on doit envoyer game complet pour recuperer les stats
        this.server.to(data.gameId).emit('playerFinishedMoving', { game: this.gameCreationService.getGame(data.gameId) });
        // si le joueur est tombé alors on doit avertir le frontend pour qu'il passe au tour suivant
        if (hasFell) {
            this.server.to(data.gameId).emit('playerFell', { game: this.gameCreationService.getGame(data.gameId) });
            // endTurn doit être appelé
        }
    }

    // à chaque abandon de joueur
    @SubscribeMessage('isGameFinished')
    isGameFinished(gameId: string): void {
        const game = this.gameCreationService.getGame(gameId);
        if (game.players.length === 1 && game.hasStarted) {
            this.server.to(gameId).emit('gameFinishedNoWin', { winner: game.players[0] });
        }
    }

    // à chaque fin de combat
    @SubscribeMessage('hasPlayerWon')
    hasPlayerWon(gameId: string): void {
        const game = this.gameCreationService.getGame(gameId);
        game.players.forEach((player) => {
            if (player.specs.nVictories >= 3) {
                this.server.to(gameId).emit('playerWon', { winner: player });
            }
        });
    }

    @SubscribeMessage('endTurn')
    endTurn(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGame(gameId);
        const player = game.players.find((player) => player.turn === game.currentTurn);

        if (
            game.tiles.some(
                (tile) => tile.coordinate.x === player.position.x && tile.coordinate.y === player.position.y && tile.category === TileCategory.Ice,
            )
        ) {
            // si le joueur est sur une tuile de glace son attaque et sa defense diminue de 2 jusqu'au prochain tour
            player.specs.attack -= 2;
            player.specs.defense -= 2;
        }
        this.gameManagerService.updateTurnCounter(gameId);
        this.server.to(game.hostSocketId).emit('playerFinishedTurn', { game: this.gameCreationService.getGame(gameId) });
    }

    @SubscribeMessage('startTurn')
    startTurn(client: Socket, gameId: string): void {
        const game = this.gameCreationService.getGame(gameId);
        const player = game.players.find((player) => player.turn === game.currentTurn);
        // si le tour du joueur a abandonné
        if (!player.isActive || !player) {
            // on update juste le compteur du currentTurn et on renvoie playerFinishedTurn
            game.currentTurn++;
            this.server.to(game.hostSocketId).emit('playerFinishedTurn', { game: this.gameCreationService.getGame(gameId) });
            return;
        }
        if (
            game.tiles.some(
                (tile) => tile.coordinate.x === player.position.x && tile.coordinate.y === player.position.y && tile.category === TileCategory.Ice,
            )
        ) {
            // on lui redonne ses points d'attaque et de defense pour son mouvement MAIS s'il effectue un combat
            // on doit vérifier la tuile sur laquelle il est pour lui enlever ses points d'attaque et de defense
            // s'il est toujours sur une tuile de glace
            player.specs.attack += 2;
            player.specs.defense += 2;
        }
        game.players.forEach((player) => {
            if (player.turn === game.currentTurn) {
                this.server.to(player.socketId).emit('yourTurn');
            } else {
                this.server.to(player.socketId).emit('playerTurn');
            }
        });
    }

    // devrait plutot etre une action globale qui verifie le contenu de position (porte ou item pour savoir si on ramasse ou on ouvre)
    // @SubscribeMessage('manipulateDoor')
    // manipulateDoor(client: Socket, data: { gameId: string; doorPosition: Coordinate }): void {
    //     const game = this.gameCreationService.getGame(data.gameId);
    //     game.doorTiles.forEach((door) => {
    //         if (door.coordinate.x === data.doorPosition.x && door.coordinate.y === data.doorPosition.y) {
    //             if (!game.players.some((player) => player.position.x === door.coordinate.x && player.position.y === door.coordinate.y)) {
    //                 door.isOpened = !door.isOpened;
    //                 this.server.to(data.gameId).emit('doorManipulated', { game: this.gameCreationService.getGame(data.gameId) });
    //                 game.nDoorsManipulated++;
    //             }
    //         }
    //     });
    // }
}
