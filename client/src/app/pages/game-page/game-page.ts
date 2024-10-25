import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { CombatModalComponent } from '@app/components/combat-modal/combat-modal.component';
import { GameMapComponent } from '@app/components/game-map/game-map.component';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Game, Player, Specs } from '@common/game';
import { Map } from '@common/map.types';

/* eslint-disable no-unused-vars */

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [CommonModule, GameMapComponent, ChatroomComponent, RouterLink, CombatModalComponent],
    templateUrl: './game-page.html',
    styleUrl: './game-page.scss',
})
export class GamePageComponent implements OnInit, OnDestroy {
    game: Game;
    mapWidth: number;
    mapHeight: number;
    numberOfPlayers: number;
    player: Player;
    activePlayers: Player[] = [];
    gameId: string;
    showExitModal = false;
    map: Map;
    specs: Specs;

    isCombatModalOpen = false;

    constructor(
        private router: Router,
        private socketService: SocketService,
    ) {}

    ngOnInit() {
        const state = history.state as { player: Player; gameId: string };
        if (state && state.player && state.gameId) {
            this.player = state.player;
            this.gameId = state.gameId;
            // this.socketService.sendMessage('getPlayers', this.gameId);
            console.log('Navigated to GamePage with player:', this.player, 'and gameId:', this.gameId);

            this.loadGameData();
            this.loadPlayerData();
        } else {
            console.error('No game or player data passed through navigation');
            this.navigateToMain();
        }
    }

    loadGameData() {
        this.socketService.sendMessage('getGame', this.gameId);
        this.socketService.listen<Game>('currentGame').subscribe((game: Game | undefined) => {
            if (game) {
                this.game = game;
                this.mapWidth = game.mapSize?.x;
                this.mapHeight = game.mapSize?.y;
                console.log('Game data loaded:', game);
            } else {
                console.error('Failed to load game data');
            }
        });
    }

    loadPlayerData() {
        this.socketService.sendMessage('getPlayers', this.gameId);
        this.socketService.listen<Player[]>('currentPlayers').subscribe((players: Player[] | undefined) => {
            if (players && players.length > 0) {
                this.activePlayers = players;
                console.log('Player data loaded:', players);
            } else {
                console.error('Failed to load players or no players available');
            }
        });
    }

    navigateToMain(): void {
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

    startCombat(): void {
        this.isCombatModalOpen = true;
    }

    ngOnDestroy() {
        this.socketService.sendMessage('leaveGame', this.gameId);
    }
}
