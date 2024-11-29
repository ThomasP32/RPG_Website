import { Component, Input } from '@angular/core';
import { CharacterService } from '@app/services/character/character.service';
import { ImageService } from '@app/services/image/image.service';
import { Avatar, Player } from '@common/game';

@Component({
    selector: 'app-player-infos',
    standalone: true,
    imports: [],
    templateUrl: './player-infos.component.html',
    styleUrl: './player-infos.component.scss',
})
export class PlayerInfosComponent {
    @Input() player: Player;
    constructor(
        private readonly characterService: CharacterService,
        protected readonly imageService: ImageService,
    ) {
        this.imageService = imageService;
        this.characterService = characterService;
    }

    playerPreview: string = this.characterService.getAvatarPreview(Avatar.Avatar1);
}
