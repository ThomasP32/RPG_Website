import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { CombatModalComponent } from '@app/components/combat-modal/combat-modal.component';
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
    imports: [CommonModule, GameMapComponent, ChatroomComponent, RouterLink, CombatModalComponent, PlayersListComponent],
    templateUrl: './game-page.html',
    styleUrl: './game-page.scss',
})
export class GamePageComponent implements OnInit, OnDestroy {
    game: Game;
    numberOfPlayers: number;
    player: Player;
    opponent: Player;
    activePlayers: Player[] = [];
    currentPlayerTurn: Player;
    socketSubscription: Subscription = new Subscription();
    playerPreview: string;
    gameId: string;
    combatRoomId: string;
    showExitModal = false;
    showKickedModal = false;
    map: Map;
    specs: Specs;

    isCombatModalOpen = false;

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
        this.combatListener();
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

    combatListener() {
        this.socketSubscription.add(
            this.socketService.listen<{ message: string; combatRoomId: string; challenger: Player }>('combatStarted').subscribe((data) => {
                console.log(`${data.message} in room ${data.combatRoomId}`);
                this.opponent = data.challenger;
                this.combatRoomId = data.combatRoomId;
                this.isCombatModalOpen = true;
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<string>('combatFinishedByEvasion').subscribe((message) => {
                console.log(message);
                setTimeout(() => {
                    this.isCombatModalOpen = false;
                }, 3000);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ message: string; combatWinner: Player; combatLooser: Player }>('combatFinishedNormally').subscribe((data) => {
                console.log(data.message);
                for (let player of this.activePlayers) {
                    if (player.socketId === data.combatLooser.socketId) {
                        player = data.combatLooser;
                    } else if (player.socketId === data.combatWinner.socketId) {
                        player = data.combatWinner;
                    }
                }
                console.log('Players updated after combat:', this.activePlayers);
                setTimeout(() => {
                    this.isCombatModalOpen = false;
                }, 3000);
            }),
        );
    }

    navigateToMain(): void {
        this.socketService.disconnect();
        this.router.navigate(['/main-menu']);
    }

    confirmExit(): void {
        this.navigateToMain();
        this.showExitModal = false;
        this.characterService.resetCharacterAvailability();
        this.playerService.resetPlayer();
    }

    openExitConfirmationModal(): void {
        this.showExitModal = true;
    }

    closeExitModal(): void {
        this.showExitModal = false;
    }

    startCombat(): void {
        this.socketService.sendMessage('startCombat', { gameId: this.gameId, opponent: this.activePlayers[1] });
    }

    ngOnDestroy() {
        this.socketService.disconnect();
        this.socketService.sendMessage('leaveGame', this.gameId);
    }
}
