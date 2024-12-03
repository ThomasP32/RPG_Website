import { Component, Input, OnInit } from '@angular/core';
import { CharacterService } from '@app/services/character/character.service';
import { ImageService } from '@app/services/image/image.service';
import { Player } from '@common/game';

@Component({
    selector: 'app-player-infos',
    standalone: true,
    imports: [],
    templateUrl: './player-infos.component.html',
    styleUrl: './player-infos.component.scss',
})
export class PlayerInfosComponent implements OnInit {
    @Input() player: Player;

    playerPreview: string = '';
    constructor(
        private readonly characterService: CharacterService,
        protected readonly imageService: ImageService,
    ) {
        this.imageService = imageService;
        this.characterService = characterService;
    }

    ngOnInit(): void {
        this.playerPreview = this.characterService.getAvatarPreview(this.player.avatar);
    }
}
