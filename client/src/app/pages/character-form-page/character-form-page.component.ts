import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { Character } from '@app/interfaces/character';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { TIME_REDIRECTION } from '@common/constants';
import { GameCreationEvents, JoinGameData } from '@common/events/game-creation.events';
import { Bonus, Game, Player } from '@common/game';
import { Map } from '@common/map.types';
import { firstValueFrom, Subscription } from 'rxjs';

@Component({
    selector: 'app-character-form-page',
    standalone: true,
    imports: [RouterOutlet, CommonModule, FormsModule],
    templateUrl: './character-form-page.component.html',
    styleUrls: ['./character-form-page.component.scss'],
})
export class CharacterFormPageComponent implements OnInit, OnDestroy {
    @ViewChild('nameInput') nameInput: ElementRef;
    socketSubscription: Subscription = new Subscription();
    Bonus = Bonus;
    name: string = '';
    isEditing: boolean = false;

    lifeOrSpeedBonus: 'life' | 'speed';
    attackOrDefenseBonus: 'attack' | 'defense';

    selectedCharacter: Character;
    currentIndex: number;

    gameId: string | null = null;
    mapName: string | null = null;

    gameHasStarted: boolean = false;
    gameLockedModal: boolean = false;
    isJoiningGame: boolean = false;

    showSelectionError: boolean = false;
    showCharacterNameError: boolean = false;
    showBonusError: boolean = false;
    showDiceError: boolean = false;

    showGameStartedModal: boolean = false;

    constructor(
        private readonly communicationMapService: CommunicationMapService,
        private readonly socketService: SocketService,
        private readonly playerService: PlayerService,
        private readonly characterService: CharacterService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
    ) {
        this.communicationMapService = communicationMapService;
        this.socketService = socketService;
        this.playerService = playerService;
        this.characterService = characterService;
        this.router = router;
        this.route = route;
    }

    async ngOnInit(): Promise<void> {
        this.playerService.resetPlayer();
        this.name = this.playerService.player.name || 'Choisis ton nom';

        this.selectedCharacter = this.characters[0];
        this.currentIndex = 0;

        if (!this.router.url.includes('create-game')) {
            this.listenToGameStatus();
            this.listenToPlayerJoin();
            this.isJoiningGame = true;
            this.gameId = this.route.snapshot.params['gameId'];
            this.socketService.sendMessage(GameCreationEvents.GetPlayers, this.gameId);
        } else {
            this.mapName = this.route.snapshot.params['mapName'];
        }
    }

    get life(): number {
        return this.playerService.player.specs.life;
    }

    get speed(): number {
        return this.playerService.player.specs.speed;
    }

    get attack(): number {
        return this.playerService.player.specs.attack;
    }

    get defense(): number {
        return this.playerService.player.specs.defense;
    }

    get attackBonus(): Bonus {
        return this.playerService.player.specs.attackBonus;
    }

    get defenseBonus(): Bonus {
        return this.playerService.player.specs.defenseBonus;
    }

    get characters(): Character[] {
        return this.characterService.characters;
    }

    listenToGameStatus(): void {
        this.socketSubscription.add(
            this.socketService.listen<string>(GameCreationEvents.GameLocked).subscribe(() => {
                this.gameLockedModal = true;
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<Game>(GameCreationEvents.GameCreated).subscribe((game) => {
                this.gameId = game.id;
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<string>(GameCreationEvents.GameAlreadyStarted).subscribe(() => {
                this.showGameStartedModal = true;
                setTimeout(() => {
                    this.characterService.resetCharacterAvailability();
                    this.router.navigate(['/main-menu']);
                }, TIME_REDIRECTION);
            }),
        );
    }

    listenToPlayerJoin(): void {
        this.socketSubscription.add(
            this.socketService.listen<Player>(GameCreationEvents.YouJoined).subscribe((updatedPlayer: Player) => {
                this.playerService.setPlayer(updatedPlayer);
                this.router.navigate([`${this.gameId}/waiting-room/player`]);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<Player[]>(GameCreationEvents.CurrentPlayers).subscribe((players: Player[]) => {
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
                            this.playerService.setPlayerAvatar(this.selectedCharacter.id);
                            this.currentIndex = i;
                            break;
                        }
                    }
                }
            }),
        );
    }

    selectCharacter(character: Character) {
        if (character.isAvailable) {
            this.selectedCharacter = character;
            this.playerService.setPlayerAvatar(character.id);
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

    addBonus(bonusType: 'life' | 'speed'): void {
        this.lifeOrSpeedBonus = bonusType;
        this.playerService.assignBonus(this.lifeOrSpeedBonus);
    }

    assignDice(bonusType: 'attack' | 'defense'): void {
        this.attackOrDefenseBonus = bonusType;
        this.playerService.assignDice(this.attackOrDefenseBonus);
    }

    toggleEditing(): void {
        this.isEditing = !this.isEditing;
        if (this.isEditing) {
            this.startEditing();
        } else {
            this.stopEditing();
        }
    }

    startEditing(): void {
        this.isEditing = true;

        if (this.name === 'Choisis ton nom') {
            this.name = '';
        }

        setTimeout(() => {
            this.nameInput.nativeElement.focus();
        });
    }

    stopEditing(): void {
        this.isEditing = false;
        const trimmedName = this.name.trim();

        if (trimmedName !== '') {
            this.playerService.setPlayerName(trimmedName);
        } else {
            this.name = 'Choisis ton nom';
        }
    }

    async onSubmit() {
        if (this.gameLockedModal) {
            this.gameLockedModal = false;
        }
        if (this.verifyErrors()) {
            this.playerService.createPlayer();

            if (this.router.url.includes('create-game')) {
                try {
                    const chosenMap = await firstValueFrom(this.communicationMapService.basicGet<Map>(`map/${this.mapName}`));
                    if (!chosenMap) {
                        this.showSelectionError = true;
                        setTimeout(() => {
                            this.router.navigate(['/create-game']);
                        }, TIME_REDIRECTION);
                    } else {
                        this.router.navigate([`${this.mapName}/waiting-room/host`]);
                    }
                } catch (error) {
                    this.showSelectionError = true;
                    setTimeout(() => {
                        this.router.navigate(['/create-game']);
                    }, TIME_REDIRECTION);
                }
            } else {
                const joinGameData: JoinGameData = { player: this.playerService.player, gameId: this.gameId! };
                this.socketService.sendMessage(GameCreationEvents.JoinGame, joinGameData);
            }
        }
    }

    onReturn() {
        if (!this.router.url.includes('create-game')) {
            this.router.navigate(['/main-menu']);
        } else {
            this.router.navigate(['/create-game']);
        }
    }

    verifyErrors(): boolean {
        this.showSelectionError = false;
        this.showCharacterNameError = false;
        this.showBonusError = false;
        this.showDiceError = false;

        if (this.name === 'Choisis un nom' || this.playerService.player.name === '') {
            this.showCharacterNameError = true;
            return false;
        }

        if (!this.lifeOrSpeedBonus) {
            this.showBonusError = true;
            return false;
        }

        if (!this.attackOrDefenseBonus) {
            this.showDiceError = true;
            return false;
        }
        return true;
    }

    onQuit() {
        this.socketService.disconnect();
        this.characterService.resetCharacterAvailability();
        this.router.navigate(['/main-menu']);
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'ArrowLeft') {
            this.previousCharacter();
        } else if (event.key === 'ArrowRight') {
            this.nextCharacter();
        }
    }

    ngOnDestroy(): void {
        this.socketSubscription.unsubscribe();
    }
}
