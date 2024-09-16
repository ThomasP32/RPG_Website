import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Character } from '@app/interfaces/character';
import { CharacterService } from '@app/services/character.service';

@Component({
    selector: 'app-create-character',
    standalone: true,
    templateUrl: './create-character.component.html',
    styleUrls: ['./create-character.component.scss'],
    imports: [FormsModule, CommonModule],
})
export class CreateCharacterComponent {
    characterName: string = '';
    selectedCharacter = '';
    lifeOrSpeedBonus = '';
    diceAssignment = '';
    attackBonus = '';
    defenseBonus = '';

    life = 4;
    speed = 4;

    characters: Character[] = [];

    private readonly characterService: CharacterService = inject(CharacterService);
    private readonly router: Router;

    constructor() {
        this.characterService.getCharacters().subscribe((characters) => {
            this.characters = characters;
        });
    }

    addBonus() {
        this.life = 4;
        this.speed = 4;

        if (this.lifeOrSpeedBonus === 'life') {
            this.life += 2;
        } else if (this.lifeOrSpeedBonus === 'speed') {
            this.speed += 2;
        }
    }

    assignDice() {
        if (this.diceAssignment === 'attack') {
            this.attackBonus = 'D4';
            this.defenseBonus = 'D6';
        } else if (this.diceAssignment === 'defense') {
            this.attackBonus = 'D6';
            this.defenseBonus = 'D4';
        }
    }

    onSubmit() {
        this.router.navigate(['/waiting-room']);
    }
}
