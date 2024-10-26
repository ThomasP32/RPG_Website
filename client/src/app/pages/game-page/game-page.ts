import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { GameMapComponent } from '@app/components/game-map/game-map.component';
import { PlayersListComponent } from '@app/components/players-list/players-list.component';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Game, Player, Specs } from '@common/game';
import { Map } from '@common/map.types';
import { Subscription } from 'rxjs';

/* eslint-disable no-unused-vars */

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [CommonModule, GameMapComponent, ChatroomComponent, RouterLink, PlayersListComponent],
    templateUrl: './game-page.html',
    styleUrl: './game-page.scss',
})
export class GamePageComponent implements OnInit, OnDestroy {
    game: Game;
    numberOfPlayers: number;
    player: Player;
    activePlayers: Player[] = [];
    currentPlayerTurn: Player;
    socketSubscription: Subscription = new Subscription();
    playerPreview: string;
    gameId: string;
    showExitModal = false;
    showKickedModal = false;
    map: Map;
    specs: Specs;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private socketService: SocketService,
        private characterService: CharacterService,
        private playerService: PlayerService,
    ) {}

    ngOnInit() {
        this.player = this.playerService.getPlayer();
        this.gameId = this.route.snapshot.params['gameId'];
        this.listenPlayersLeft();
        this.playerPreview = this.characterService.getAvatarPreview(this.player.avatar);
        console.log('Navigated to GamePage with player:', this.player, 'and gameId:', this.gameId);
        this.loadGameData();
        this.loadPlayerData();
        this.socketService.sendMessage('getPlayers', this.gameId);
        this.socketService.sendMessage('getGame', this.gameId);
    }

    listenPlayersLeft() {
        this.socketSubscription.add(
            this.socketService.listen<Player[]>('playerLeft').subscribe((players: Player[]) => {
                this.activePlayers = players.filter((player) => player.isActive);
                if (this.activePlayers.length <= 1) {
                    // afficher modale comme quoi la partie est terminée pcq plus assez de joueurs
                    this.showExitModal = false;
                    this.showKickedModal = true;
                    setTimeout(() => {
                        this.navigateToMain();
                    }, 3000);
                }
            }),
        );
    }

    loadGameData() {
        this.socketService.listen<Game>('currentGame').subscribe((game: Game) => {
            if (game) {
                this.game = game;
                this.currentPlayerTurn = game.players.filter((player) => player.turn === 0)[0];
                console.log('Game data loaded:', game);
            } else {
                console.error('Failed to load game data');
            }
        });
    }

    loadPlayerData() {
        this.socketService.listen<Player[]>('currentPlayers').subscribe((players: Player[]) => {
            if (players && players.length > 0) {
                this.activePlayers = players.filter((player) => player.isActive);
            } else {
                console.error('Failed to load players or no players available');
            }
        });
    }

    navigateToMain(): void {
        this.socketService.disconnect();
        this.router.navigate(['/main-menu']);
    }

    confirmExit(): void {
        this.navigateToMain();
        this.showExitModal = false;
    }

    openExitConfirmationModal(): void {
        this.showExitModal = true;
    }

    closeExitModal(): void {
        this.showExitModal = false;
    }

    ngOnDestroy() {
        this.socketService.disconnect();
        this.socketService.sendMessage('leaveGame', this.gameId);
    }
}
