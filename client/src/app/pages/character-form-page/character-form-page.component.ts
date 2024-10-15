import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { Character } from '@app/interfaces/character';
import { CharacterService } from '@app/services/character/character.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Bonus, Player, Specs } from '@common/game';
import { Map } from '@common/map.types';
import { firstValueFrom } from 'rxjs';
/* eslint-disable no-unused-vars */
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
    Bonus = Bonus;
    characterName: string = 'Choisis un nom';
    isEditing: boolean = false;

    lifeOrSpeedBonus = '';
    attackOrDefenseBonus = '';
    attackBonus: Bonus;
    defenseBonus: Bonus;

    selectedCharacter: Character;
    characters: Character[] = [];

    currentIndex: number = 0;

    life = defaultHp;
    speed = defaultSpeed;
    attack = defaultAttack;
    defense = defaultDefense;
    gameId: string | null = null;
    mapName: string | null = null;
    maps: Map[] = [];
    // map: Map;
    showErrorMessage: { selectionError: boolean; characterNameError: boolean; bonusError: boolean; diceError: boolean } = {
        selectionError: false,
        characterNameError: false,
        bonusError: false,
        diceError: false,
    };

    private readonly characterService: CharacterService = inject(CharacterService);
    private readonly router: Router = inject(Router);
    private readonly route: ActivatedRoute = inject(ActivatedRoute);

    constructor(private communicationMapService: CommunicationMapService) {
        this.characterService.getCharacters().subscribe((characters) => {
            this.characters = characters;
            this.selectedCharacter = this.characters[0];
        });

        this.mapName = this.route.snapshot.params['mapName'];
        if (!this.router.url.includes('create-game')) {
            this.gameId = this.route.snapshot.params['gameId'];
        }
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
            this.attackBonus = Bonus.D6;
            this.defenseBonus = Bonus.D4;
        } else if (this.attackOrDefenseBonus === 'defense') {
            this.attackBonus = Bonus.D4;
            this.defenseBonus = Bonus.D6;
        }
    }

    toggleEditing() {
        this.isEditing = !this.isEditing;
        this.characterName = '';
    }

    stopEditing() {
        this.isEditing = false;
        this.characterName = this.characterName.trim();
        if (!this.characterName) {
            this.characterName = 'Choisis ton nom';
        }
    }

    async onSubmit() {

        this.showErrorMessage = {
            selectionError: false,
            characterNameError: false,
            bonusError: false,
            diceError: false,
        };

        if (this.characterName === '' || this.characterName === 'Choisis un nom') {
            this.showErrorMessage.characterNameError = true;
            return;
        }

        if (!this.lifeOrSpeedBonus) {
            this.showErrorMessage.bonusError = true;
            return;
        }

        if (!this.attackOrDefenseBonus) {
            this.showErrorMessage.diceError = true;
            return;
        }

        const playerSpecs: Specs = {
            life: this.life,
            speed: this.speed,
            attack: this.attack,
            defense: this.defense,
            attackBonus: this.attackBonus,
            defenseBonus: this.defenseBonus,
            movePoints: 0,
            actions: 0,
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
            nEvasions: 0,
            nLifeTaken: 0,
            nLifeLost: 0,
        };
        const player: Player = {
            name: this.characterName,
            socketId: '',
            isActive: true,
            avatar: this.selectedCharacter.id,
            specs: playerSpecs,
            inventory: [],
            position: { x: 0, y: 0 },
            turn: 0,
        };

        if (this.router.url.includes('create-game')) {
            const chosenMap = await firstValueFrom(this.communicationMapService.basicGet<Map>(`map/${this.mapName}`));
            if (!chosenMap) {
                this.showErrorMessage.selectionError = true;
                setTimeout(() => {
                    this.router.navigate(['/create-game']);
                }, timeLimit);
            } else {
                this.router.navigate([`create-game/${this.mapName}/waiting-room`], { state: { player: player } });
            }
        } else {
            this.router.navigate([`join-game/${this.gameId}/${this.mapName}/waiting-room`], { state: { player: player } });
        }
    }

    onReturn() {
        this.router.navigate(['/create-game']);
    }
}
