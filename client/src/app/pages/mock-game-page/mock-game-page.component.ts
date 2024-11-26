import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { CombatListComponent } from '@app/components/combat-list/combat-list.component';
import { GameMapComponent } from '@app/components/game-map/game-map.component';
import { JournalComponent } from '@app/components/journal/journal.component';
import { PlayerInfosComponent } from '@app/components/player-infos/player-infos.component';
import { CharacterService } from '@app/services/character/character.service';
import { ImageService } from '@app/services/image/image.service';
import { Avatar, Bonus, Player } from '@common/game';
import { GamePageActiveView } from '@common/game-page';
import { ItemCategory } from '@common/map.types';

@Component({
    selector: 'app-mock-game-page',
    standalone: true,
    imports: [CommonModule, GameMapComponent, JournalComponent, ChatroomComponent, CombatListComponent, PlayerInfosComponent],
    templateUrl: './mock-game-page.component.html',
    styleUrl: './mock-game-page.component.scss',
})
export class MockGamePageComponent {
    GamePageActiveView = GamePageActiveView;
    activeView: GamePageActiveView = GamePageActiveView.Chat;
    activePlayers: Player[];
    opponent: Player;
    possibleOpponents: Player[];

    player: Player = {
        socketId: 'test-socket',
        name: 'Test Player',
        avatar: Avatar.Avatar1,
        isActive: true,
        position: { x: 0, y: 0 },
        initialPosition: { x: 0, y: 0 },
        specs: {
            evasions: 2,
            life: 3,
            speed: 4,
            attack: 2,
            defense: 5,
            movePoints: 5,
            actions: 2,
            attackBonus: Bonus.D4,
            defenseBonus: Bonus.D6,
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
            nEvasions: 0,
            nLifeTaken: 0,
            nLifeLost: 0,
        },
        inventory: [ItemCategory.TimeTwister, ItemCategory.Armor],
        turn: 0,
        visitedTiles: [],
    };

    game = {
        id: 'test-game',
        mapSize: { x: 10, y: 10 },
        players: [
            {
                name: 'Player 1',
                avatar: 'assets/avatar1.png',
                specs: { nVictories: 3 },
                socketId: '1',
                isActive: true,
            },
            {
                name: 'Player 2',
                avatar: 'assets/avatar2.png',
                specs: { nVictories: 1 },
                socketId: '2',
                isActive: true,
            },
            {
                name: 'Player 3',
                avatar: 'assets/avatar3.png',
                specs: { nVictories: 0 },
                socketId: '3',
                isActive: false,
            },
        ],
    };

    constructor(
        protected readonly imageService: ImageService,
        protected readonly characterService: CharacterService,
    ) {
        this.imageService = imageService;
        this.characterService = characterService;
    }

    playerPreview: string = this.characterService.getAvatarPreview(Avatar.Avatar1); // Mock player avatar
    playerImage2: string = this.characterService.getAvatarPreview(Avatar.Avatar2); // Mock player avatar
    delayFinished = true; // Simulates turn countdown
    youFell = false; // Simulates a player falling condition
    currentPlayerTurn = 'Player 1'; // Mock current player
    startTurnCountdown = 3; // Mock countdown timer
    countdown = 30; // Mock time remaining for the turn
    isPulsing = true; // Animation state for the countdown timer
    actionMessage = 'Ouvrir la porte'; // Default action message
    combatAvailable = true;

    toggleView(view: GamePageActiveView): void {
        this.activeView = view;
    }

    toggleDoor() {
        console.log('Door toggled');
    }
    endTurn() {
        console.log('Turn ended');
    }
}
