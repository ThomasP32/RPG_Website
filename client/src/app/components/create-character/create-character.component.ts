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

    defaultPoints = 4;

    life = this.defaultPoints;
    speed = this.defaultPoints;

    attack = this.defaultPoints;
    defense = this.defaultPoints;

    diceRollD4 = 0;
    diceRollD6 = 0;
    diceRolled: boolean = false;
    rollingDiceFor: string = '';
    rolledD4: boolean = false;

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

    rollDice(sides: number): number {
        return Math.floor(Math.random() * sides) + 1;
    }

    rollFor(attribute: string) {
        this.rollingDiceFor = attribute;
        this.diceRolled = false;
    }

    assignD4() {
        const rollResult = this.rollDice(4);
        this.diceRollD4 = rollResult;
        if (this.rollingDiceFor === 'attack') {
            this.attack = this.defaultPoints + this.diceRollD4;
        } else if (this.rollingDiceFor === 'defense') {
            this.defense = this.defaultPoints + this.diceRollD4;
        }
        this.diceRolled = false;
        this.rolledD4 = true;
    }

    assignD6() {
        const rollResult = this.rollDice(6);
        this.diceRollD4 = rollResult;
        if (this.rollingDiceFor === 'attack') {
            this.defense = this.defaultPoints + this.diceRollD6;
        } else if (this.rollingDiceFor === 'defense') {
            this.attack = this.defaultPoints + this.diceRollD6;
        }
    }

    onSubmit() {
        this.router.navigate(['/waiting-room']);
    }
}
