import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';

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
    @Inject(CharacterService) private characterService: CharacterService;

    constructor() {}

    getAvatarPreview(avatar: Avatar): string {
        return this.characterService.getAvatarPreview(avatar);
    }
}
