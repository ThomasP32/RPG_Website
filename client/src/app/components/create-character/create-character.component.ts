import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Character } from '@app/interfaces/character';
import { CharacterService } from '@app/services/character.service';

const four = 4;

@Component({
    selector: 'app-create-character',
    standalone: true,
    templateUrl: './create-character.component.html',
    styleUrls: ['./create-character.component.scss'],
    imports: [FormsModule, CommonModule],
})
export class CreateCharacterComponent {
    mapId: string = '';
    convertedId: string = '';

    characterName: string = '';
    selectedCharacter = '';
    lifeOrSpeedBonus = '';
    attackOrDefenseBonus = '';
    attackBonus = '';
    defenseBonus = '';

    defaultPoints = four;

    life = this.defaultPoints;
    speed = this.defaultPoints;
    attack = this.defaultPoints;
    defense = this.defaultPoints;

    characters: Character[] = [];

    private readonly characterService: CharacterService = inject(CharacterService);
    private readonly router: Router = inject(Router);
    private route: ActivatedRoute;

    ngOnInit() {
        this.getUrlParams();
        this.urlConverter(this.mapId);
        this.loadCharacters();
    }

    loadCharacters() {
        this.characterService.getCharacters().subscribe((characters) => {
            this.characters = characters;
        });
    }

    addBonus() {
        if (this.lifeOrSpeedBonus === 'life') {
            this.life += 2;
        } else if (this.lifeOrSpeedBonus === 'speed') {
            this.speed += 2;
        }
    }

    assignDice() {
        this.attackBonus = '';
        this.defenseBonus = '';

        if (this.attackOrDefenseBonus === 'attack') {
            this.attackBonus = 'D6';
            this.defenseBonus = 'D4';
        } else if (this.attackOrDefenseBonus === 'defense') {
            this.attackBonus = 'D4';
            this.defenseBonus = 'D6';
        }
    }

    getUrlParams() {
        this.route.queryParams.subscribe((params) => {
            this.mapId = this.route.snapshot.params['id'];
        });
    }

    urlConverter(mapId: string) {
        if (mapId) {
            console.log('URL params id :', mapId);
            this.convertedId = mapId.split('=')[1];
        }
    }

    onSubmit() {
        this.router.navigate(['/waiting-room']);
    }
}
