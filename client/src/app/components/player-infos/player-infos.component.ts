import { Component } from '@angular/core';
import { CharacterService } from '@app/services/character/character.service';
import { Avatar, Bonus, Player } from '@common/game';
import { ItemCategory } from '@common/map.types';

@Component({
    selector: 'app-player-infos',
    standalone: true,
    imports: [],
    templateUrl: './player-infos.component.html',
    styleUrl: './player-infos.component.scss',
})
export class PlayerInfosComponent {
    player: Player = {
        socketId: 'test-socket',
        name: '123456789012345',
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
    constructor(private readonly characterService: CharacterService) {
        this.characterService = characterService;
    }

    playerPreview: string = this.characterService.getAvatarPreview(Avatar.Avatar1);
}
