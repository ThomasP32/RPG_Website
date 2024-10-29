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
        console.log('on a demandé les mouvements');
        const game = this.gameCreationService.getGameById(data.gameId);
        const moves = this.gameManagerService.getMoves(data.gameId, data.playerName);
        const tiles = game.tiles;
        const doors = game.doorTiles;
        client.emit('playerPossibleMoves', moves);
        console.log('on lui a envoyé ses mouvements', moves);
        console.log('ca cest ses tuiles ', tiles);
        console.log('ca cest ses portes ', doors);
    }

    @SubscribeMessage('previewMove')
    getPreviewMove(client: Socket, data: { playerName: string; gameId: string; position: Coordinate }): void {
        if (!this.gameCreationService.doesGameExist(data.gameId)) {
            client.emit('gameNotFound');
            return;
        }
        this.gameCreationService.getGameById(data.gameId);
        const moves = this.gameManagerService.getMove(data.gameId, data.playerName, data.position, true);
        client.emit('playerPossibleMove', { moves: moves });
    }

    @SubscribeMessage('moveToPosition')
    getMove(client: Socket, data: { playerName: string; gameId: string; destination: Coordinate }): void {
        if (!this.gameCreationService.doesGameExist(data.gameId)) {
            client.emit('gameNotFound');
            return;
        }
        this.gameCreationService.getGameById(data.gameId);
        let hasFell = false;
        const moves = this.gameManagerService.getMove(data.gameId, data.playerName, data.destination, false);
        const player = this.gameCreationService.getGameById(data.gameId).players.find((player) => player.name === data.playerName);
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
        this.server.to(data.gameId).emit('playerFinishedMoving', { game: this.gameCreationService.getGameById(data.gameId) });
        // si le joueur est tombé alors on doit avertir le frontend pour qu'il passe au tour suivant
        if (hasFell) {
            this.server.to(data.gameId).emit('playerFell', { game: this.gameCreationService.getGameById(data.gameId) });
            // endTurn doit être appelé
        }
    }

    // à chaque abandon de joueur
    @SubscribeMessage('isGameFinished')
    isGameFinished(gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        if (game.players.length === 1 && game.hasStarted) {
            this.server.to(gameId).emit('gameFinishedNoWin', { winner: game.players[0] });
        }
    }

    // à chaque fin de combat
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
            // si le joueur est sur une tuile de glace son attaque et sa defense diminue de 2 jusqu'au prochain tour
            console.log('le joueur est sur une tuile de glace : ', player);
            player.specs.attack -= 2;
            player.specs.defense -= 2;
        }
        player.specs.movePoints = player.specs.speed;
        this.gameManagerService.updateTurnCounter(gameId);
        this.server.to(game.hostSocketId).emit('playerFinishedTurn', { game: this.gameCreationService.getGameById(gameId) });
        this.startTurn(gameId);
    }

    startTurn(gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        console.log('cest le tour numéro ', game.currentTurn);
        const activePlayer = game.players.find((player) => player.turn === game.currentTurn);
        // si le tour du joueur a abandonné
        if (!activePlayer || !activePlayer.isActive) {
            game.currentTurn++;
            this.startTurn(gameId);
            return;
        }

        if (this.gameManagerService.onIceTile(activePlayer, gameId)) {
            // on lui redonne ses points d'attaque et de defense pour son mouvement MAIS s'il effectue un combat
            // on doit vérifier la tuile sur laquelle il est pour lui enlever ses points d'attaque et de defense
            // s'il est toujours sur une tuile de glace
            activePlayer.specs.attack += 2;
            activePlayer.specs.defense += 2;
        }

        activePlayer.specs.movePoints = activePlayer.specs.speed;

        console.log('on envoye son tour à tours :', activePlayer.socketId);

        this.server.to(activePlayer.socketId).emit('yourTurn');

        game.players
            .filter((player) => player.socketId !== activePlayer.socketId)
            .forEach((player) => {
                if (player.socketId !== activePlayer.socketId) {
                    console.log('on a envoyé aux autres aussi');
                    this.server.to(player.socketId).emit('playerTurn', activePlayer.name);
                }
            });
    }
}
