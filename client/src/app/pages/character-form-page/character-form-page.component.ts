import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { Character } from '@app/interfaces/character';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Bonus, Player, Specs } from '@common/game';
import { Map } from '@common/map.types';
import { firstValueFrom, Subscription } from 'rxjs';
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
export class CharacterFormPageComponent implements OnInit, OnDestroy {
    socketSubscription: Subscription = new Subscription();
    Bonus = Bonus;
    characterName: string = 'Choisis un nom';
    isEditing: boolean = false;

    player: Player;
    lifeOrSpeedBonus = '';
    attackOrDefenseBonus = '';
    attackBonus: Bonus;
    defenseBonus: Bonus;

    selectedCharacter: Character;
    characters: Character[] = [];

    currentIndex: number;

    life = defaultHp;
    speed = defaultSpeed;
    attack = defaultAttack;
    defense = defaultDefense;
    gameId: string | null = null;
    mapName: string | null = null;
    maps: Map[] = [];

    isJoiningGame: boolean = false;

    showErrorMessage: { selectionError: boolean; characterNameError: boolean; bonusError: boolean; diceError: boolean } = {
        selectionError: false,
        characterNameError: false,
        bonusError: false,
        diceError: false,
    };

    private readonly characterService: CharacterService = inject(CharacterService);
    private readonly router: Router = inject(Router);
    private readonly route: ActivatedRoute = inject(ActivatedRoute);

    constructor(
        private communicationMapService: CommunicationMapService,
        private socketService: SocketService,
    ) {}

    async ngOnInit(): Promise<void> {
        this.characterService.getCharacters().subscribe((characters) => {
            this.characters = [...characters];
            this.selectedCharacter = this.characters[0];
            this.currentIndex = 0;
        });
        // mapName est dans le path de l'url seulement si c'est une création
        if (!this.router.url.includes('create-game')) {
            // si on est dans le cas de rejoindre une partie on doit vérifier les avatars disponibles
            this.listenToSocketMessages();
            this.isJoiningGame = true;
            this.gameId = this.route.snapshot.params['gameId'];
            this.socketService.sendMessage('getPlayers', this.gameId);
        } else {
            this.mapName = this.route.snapshot.params['mapName'];
        }
    }

    listenToSocketMessages(): void {
        this.socketSubscription.add(
            this.socketService.listen<Player[]>('currentPlayers').subscribe((players: Player[]) => {
                // ca update pour donner juste les avatar disponible
                this.characters.forEach((character) => {
                    character.isAvailable = true;
                    if (players.some((player) => player.avatar === character.id)) {
                        character.isAvailable = false;
                    }
                });
                if (!this.selectedCharacter.isAvailable) {
                    for (let i = 0; i < this.characters.length; i++) {
                        if (this.characters[i].isAvailable) {
                            this.selectedCharacter = this.characters[i];
                            console.log('setting selected character');
                            this.currentIndex = i;
                            break;
                        }
                    }
                }
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<{ reason: string }>('gameNotFound').subscribe((data) => {
                // ici il va falloir handle quand un joueur essaie de join une partie qui a été fermée
                // entre le temps ou il a mis le id et il choisi son joueur
                console.log(data.reason);
            }),
        );
    }

    selectCharacter(character: Character) {
        if (character.isAvailable) {
            this.selectedCharacter = character;
        }
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'ArrowLeft') {
            this.previousCharacter();
        } else if (event.key === 'ArrowRight') {
            this.nextCharacter();
        }
    }

    previousCharacter() {
        do {
            this.currentIndex = this.currentIndex === 0 ? this.characters.length - 1 : this.currentIndex - 1;
        } while (!this.characters[this.currentIndex].isAvailable);
        this.selectedCharacter = this.characters[this.currentIndex];
    }

    nextCharacter() {
        do {
            this.currentIndex = this.currentIndex === this.characters.length - 1 ? 0 : this.currentIndex + 1;
        } while (!this.characters[this.currentIndex].isAvailable);
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

        if (!this.selectedCharacter) {
            this.showErrorMessage.selectionError = true;
            return;
        }

        this.createPlayer();

        if (this.router.url.includes('create-game')) {
            const chosenMap = await firstValueFrom(this.communicationMapService.basicGet<Map>(`map/${this.mapName}`));
            if (!chosenMap) {
                this.showErrorMessage.selectionError = true;
                setTimeout(() => {
                    this.router.navigate(['/create-game']);
                }, timeLimit);
            } else {
                // ici t'es obligé de start-game à la page suivante parce que t'as pas encore le gameId
                this.router.navigate([`create-game/${this.mapName}/waiting-room`], { state: { player: this.player } });
            }
        } else {
            this.socketService.sendMessage('joinGame', { player: this.player, gameId: this.gameId });
            this.router.navigate([`join-game/${this.gameId}/waiting-room`], { state: { player: this.player } });
        }
    }

    createPlayer() {
        if (this.selectedCharacter) {
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
            this.player = player;
        }
    }

    onReturn() {
        this.router.navigate(['/create-game']);
    }

    onQuit() {
        this.router.navigate(['/']);
    }

    ngOnDestroy(): void {
        this.socketSubscription.unsubscribe();
    }
}
