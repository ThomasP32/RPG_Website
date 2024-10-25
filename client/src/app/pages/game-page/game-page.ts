import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { GameMapComponent } from '@app/components/game-map/game-map.component';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Game, Player, Specs } from '@common/game';
import { Map } from '@common/map.types';

/* eslint-disable no-unused-vars */

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [CommonModule, GameMapComponent, ChatroomComponent, RouterLink],
    templateUrl: './game-page.html',
    styleUrl: './game-page.scss',
})
export class GamePageComponent implements OnInit, OnDestroy {
    @ViewChild(GameMapComponent, { static: false }) appGamemapComponent!: GameMapComponent;
    game: Game;
    mapSize: number;
    numberOfPlayers: number;
    player: Player;
    playerPreview: string;
    activePlayers: Player[] = [];
    gameId: string;
    showExitModal = false;
    map: Map;
    specs: Specs;

    constructor(
        private router: Router,
        private socketService: SocketService,
        private characterService: CharacterService,
    ) {}

    ngOnInit() {
        const state = history.state as { player: Player; gameId: string };
        if (state && state.player && state.gameId) {
            this.player = state.player;
            this.playerPreview = this.characterService.getAvatarPreview(this.player.avatar);
            this.gameId = state.gameId;
            this.loadGameData();
            this.loadPlayerData();
            this.socketService.sendMessage('getPlayers', this.gameId);
            console.log('Navigated to GamePage with player:', this.player, 'and gameId:', this.gameId);
            this.socketService.sendMessage('getGame', this.gameId);
        } else {
            console.error('No game or player data passed through navigation');
            this.navigateToMain();
        }
    }

    loadGameData() {
        this.socketService.listen<Game>('currentGame').subscribe((game: Game | undefined) => {
            if (game) {
                this.appGamemapComponent.map = game;
                this.game = game;
                this.mapSize = game.mapSize?.x;
                this.mapSize = game.mapSize?.y;
                console.log('Game data loaded:', game);
            } else {
                console.error('Failed to load game data');
            }
        });
    }

    loadPlayerData() {
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

    ngOnDestroy() {
        this.socketService.sendMessage('leaveGame', this.gameId);
    }
}
