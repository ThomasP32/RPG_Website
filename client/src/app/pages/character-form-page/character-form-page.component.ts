import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { Character } from '@app/interfaces/character';
import { CharacterService } from '@app/services/character/character.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Map } from '@common/map.types';
import { firstValueFrom } from 'rxjs';

const defaultHp = 4;
const defaultSpeed = 4;
const defaultAttack = 4;
const defaultDefense = 4;
const timeLimit = 5000;

@Component({
    selector: 'app-character-form-page',
    standalone: true,
    imports: [RouterOutlet, CommonModule, FormsModule],
    templateUrl: './character-form-page.component.html',
    styleUrls: ['./character-form-page.component.scss'],
})
export class CharacterFormPageComponent {
    characterName: string = 'Choisis un nom';
    isEditing: boolean = false;

    lifeOrSpeedBonus = '';
    attackOrDefenseBonus = '';
    attackBonus = '';
    defenseBonus = '';

    selectedCharacter: Character;
    characters: Character[] = [];

    currentIndex: number = 0;

    life = defaultHp;
    speed = defaultSpeed;
    attack = defaultAttack;
    defense = defaultDefense;

    mapName: string | null = null;
    maps: Map[] = [];
    // map: Map;
    showErrorMessage: { selectionError: boolean; characterNameError: boolean } = {
        selectionError: false,
        characterNameError: false,
    };

    private readonly characterService: CharacterService = inject(CharacterService);
    private readonly router: Router = inject(Router);
    private readonly route: ActivatedRoute = inject(ActivatedRoute);

    constructor(private communicationMapService: CommunicationMapService) {
        // Assume characters are fetched from a service
        this.characterService.getCharacters().subscribe((characters) => {
            this.characters = characters;
            this.selectedCharacter = this.characters[0]; // Initialize with the first character
        });

        this.route.queryParams.subscribe((params) => {
            this.mapName = params['name'];
        });
    }

    selectCharacter(character: Character) {
        this.selectedCharacter = character;
    }

    previousCharacter() {
        this.currentIndex = this.currentIndex === 0 ? this.characters.length - 1 : this.currentIndex - 1;
        this.selectedCharacter = this.characters[this.currentIndex];
    }

    nextCharacter() {
        this.currentIndex = this.currentIndex === this.characters.length - 1 ? 0 : this.currentIndex + 1;
        this.selectedCharacter = this.characters[this.currentIndex];
    }

    addBonus() {
        this.life = defaultHp;
        this.speed = defaultSpeed;
        if (this.lifeOrSpeedBonus === 'life') {
            this.life += 2;
        } else if (this.lifeOrSpeedBonus === 'speed') {
            this.speed += 2;
        }
    }

    assignDice() {
        if (this.attackOrDefenseBonus === 'attack') {
            this.attackBonus = 'D6';
            this.defenseBonus = 'D4';
        } else if (this.attackOrDefenseBonus === 'defense') {
            this.attackBonus = 'D4';
            this.defenseBonus = 'D6';
        }
    }

    toggleEditing() {
        this.isEditing = !this.isEditing;
    }

    stopEditing() {
        this.isEditing = false;
        if (!this.characterName) {
            this.characterName = 'Default Name';
        }
    }

    async onSubmit() {
        const chosenMap = await firstValueFrom(this.communicationMapService.basicGet<Map>(`map/${this.mapName}`));

        if (this.characterName === 'Choisis un nom') {
            this.showErrorMessage.characterNameError = true;
            return;
        }
        if (!chosenMap) {
            this.showErrorMessage.selectionError = true;
            setTimeout(() => {
                this.router.navigate(['/create-game']);
            }, timeLimit);
        } else {
            this.router.navigate(['/waiting-room'], { queryParams: { name: chosenMap.name } });
        }
    }

    onReturn() {
        this.router.navigate(['/create-game']);
    }
}
