import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { Character } from '@app/interfaces/character';
import { CharacterService } from '@app/services/character.service';

const defaultHp = 4;
const defaultSpeed = 4;
const defaultAttack = 4;
const defaultDefense = 4;
@Component({
    selector: 'app-character-form-page',
    standalone: true,
    imports: [RouterOutlet, CommonModule, FormsModule],
    templateUrl: './character-form-page.component.html',
    styleUrls: ['./character-form-page.component.scss'],
})
export class CharacterFormPageComponent {
    characterName: string = 'Nom du personnage';
    isEditing: boolean = false;

    lifeOrSpeedBonus = '';
    attackOrDefenseBonus = '';
    attackBonus = '';
    defenseBonus = '';

    selectedCharacter: Character;
    characters: Character[] = [];

    // defaultPoints = four;

    life = defaultHp;
    speed = defaultSpeed;
    attack = defaultAttack;
    defense = defaultDefense;

    private readonly characterService: CharacterService = inject(CharacterService);
    private readonly router: Router = inject(Router);

    private currentIndex: number = 0;

    constructor() {
        // Assume characters are fetched from a service
        this.characterService.getCharacters().subscribe((characters) => {
            this.characters = characters;
            this.selectedCharacter = this.characters[0]; // Initialize with the first character
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
    }

    onSubmit() {
        this.router.navigate(['/waiting-room']);
    }

    onReturn() {
        this.router.navigate(['/create-game']);
    }
}
