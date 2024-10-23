import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { CharacterService } from '@app/services/character/character.service';
import { Avatar, Player } from '@common/game';
@Component({
    selector: 'app-players-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './players-list.component.html',
    styleUrl: './players-list.component.scss',
})
export class PlayersListComponent {
    players: Player[];
    gameId: string;

    constructor(private characterService: CharacterService) {}

    getAvatarPreview(avatar: Avatar): string {
        return this.characterService.getAvatarPreview(avatar);
    }
}
