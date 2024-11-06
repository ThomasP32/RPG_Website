import { Component, Input, OnInit, OnChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService } from '@app/services/character/character.service';
import { Avatar, Player } from '@common/game';

@Component({
    selector: 'app-game-players-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-players-list.component.html',
    styleUrl: './game-players-list.component.scss',
})
export class GamePlayersListComponent implements OnInit, OnChanges {
    @Input() players: Player[];
    @Input() hostSocketId: string;
    @Input() currentPlayerTurn: string;
    hoveredPlayerId: string | null = null;

   
    constructor(private characterService: CharacterService) {
        this.characterService = characterService;
    }

    ngOnInit(): void {
        this.sortPlayersByTurn();
        this.initializePlayerSpecs();
    }

    getAvatarPreview(avatar: Avatar): string {
        return this.characterService.getAvatarPreview(avatar);
    }

    sortPlayersByTurn(): void {
        if (this.players) {
            this.players.sort((a, b) => a.turn - b.turn);
        }
    }

    isPlayerActive(player: Player): boolean {
        return player.isActive;
    }

    isHostPlayer(playerSocketId: string): boolean {
        return playerSocketId === this.hostSocketId;
    }

    initializePlayerSpecs(): void {
        this.players = this.players.map(player => ({
            ...player,
            specs: player.specs || { nVictories: 0 },
        }));
    }

    ngOnChanges(): void {
        this.sortPlayersByTurn();
        this.initializePlayerSpecs();
    }
}
