import { Component, Input, OnInit } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import {
    BONUS,
    DEFAULT_ACTIONS,
    DEFAULT_ATTACK,
    DEFAULT_DEFENSE,
    DEFAULT_EVASIONS,
    DEFAULT_HP,
    DEFAULT_SPEED,
    HALF,
    ProfileType,
} from '@common/constants';
import { GameCreationEvents, JoinGameData } from '@common/events/game-creation.events';
import { Avatar, Bonus, BotName, Player, Specs } from '@common/game';

@Component({
    selector: 'app-profile-modal',
    standalone: true,
    imports: [],
    templateUrl: './profile-modal.component.html',
    styleUrl: './profile-modal.component.scss',
})
export class ProfileModalComponent implements OnInit {
    @Input() activePlayers: Player[] = [];
    @Input() gameId: string | null = null;
    @Input() closeProfileModal: () => void;
    profile: 'aggressive' | 'defensive';
    selectedProfile: ProfileType;
    virtualPlayer: Player;

    constructor(private readonly socketService: SocketService) {
        this.socketService = socketService;
    }

    ngOnInit(): void {
        const playerSpecs: Specs = {
            life: DEFAULT_HP,
            speed: DEFAULT_SPEED,
            attack: DEFAULT_ATTACK,
            defense: DEFAULT_DEFENSE,
            attackBonus: Bonus.D6,
            defenseBonus: Bonus.D4,
            evasions: DEFAULT_EVASIONS,
            movePoints: 0,
            actions: DEFAULT_ACTIONS,
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
            nEvasions: 0,
            nLifeTaken: 0,
            nLifeLost: 0,
            nItemsUsed: 0,
        };
        const virtualPlayer: Player = {
            name: '',
            socketId: '',
            isActive: true,
            avatar: Avatar.Avatar1,
            specs: playerSpecs,
            inventory: [],
            position: { x: 0, y: 0 },
            initialPosition: { x: 0, y: 0 },
            turn: 0,
            visitedTiles: [],
            profile: ProfileType.NORMAL,
        };
        this.virtualPlayer = virtualPlayer;
    }

    createVirtualSocketId(): void {
        this.virtualPlayer.socketId = 'virtualPlayer' + Math.floor(Math.random() * 1000);
    }

    setProfile(profile: 'aggressive' | 'defensive'): void {
        switch (profile) {
            case 'aggressive':
                this.selectedProfile = ProfileType.AGGRESSIVE;

                break;
            case 'defensive':
                this.selectedProfile = ProfileType.DEFENSIVE;

                break;
        }
        this.highlightSelectedProfileButton();
    }

    highlightSelectedProfileButton(): void {
        const profileButtons = document.querySelectorAll('.profile-button');
        profileButtons.forEach((btn) => btn.classList.remove('profile-button--active'));

        if (this.selectedProfile === ProfileType.AGGRESSIVE) {
            const aggressiveButton = document.querySelector('.profile-button--aggressive');
            aggressiveButton?.classList.add('profile-button--active');
        } else if (this.selectedProfile === ProfileType.DEFENSIVE) {
            const defensiveButton = document.querySelector('.profile-button--defensive');
            defensiveButton?.classList.add('profile-button--active');
        }
    }

    assignRandomName(): void {
        const availableNames = Object.values(BotName).filter((value) => typeof value === 'string') as string[];
        const usedNames = this.activePlayers.map((player) => player.name);
        const unusedNames = availableNames.filter((name) => !usedNames.includes(name));
        this.virtualPlayer.name = unusedNames[Math.floor(Math.random() * unusedNames.length)];
    }

    assignRandomAvatar(): void {
        const availableAvatars = Object.values(Avatar).filter((value) => typeof value === 'number') as number[];
        const usedAvatars = this.activePlayers.map((player) => player.avatar);
        const unusedAvatars = availableAvatars.filter((avatar) => !usedAvatars.includes(avatar));
        this.virtualPlayer.avatar = unusedAvatars[Math.floor(Math.random() * unusedAvatars.length)];
    }

    assignRandomLifeOrSpeedBonus(): void {
        const type: 'life' | 'speed' = Math.random() < HALF ? 'life' : 'speed';
        if (type === 'life') {
            this.virtualPlayer.specs.life += BONUS;
            this.virtualPlayer.specs.speed = DEFAULT_SPEED;
        } else if (type === 'speed') {
            this.virtualPlayer.specs.speed += BONUS;
            this.virtualPlayer.specs.life = DEFAULT_HP;
        }
    }

    assignRandomAttackOrDefenseBonus(): void {
        const type: 'attack' | 'defense' = Math.random() < HALF ? 'attack' : 'defense';
        if (type === 'attack') {
            this.virtualPlayer.specs.attackBonus = Bonus.D6;
            this.virtualPlayer.specs.defenseBonus = Bonus.D4;
        } else if (type === 'defense') {
            this.virtualPlayer.specs.attackBonus = Bonus.D4;
            this.virtualPlayer.specs.defenseBonus = Bonus.D6;
        }
    }

    createVirtualPlayer() {
        const playerSpecs: Specs = {
            life: this.virtualPlayer.specs.life,
            speed: this.virtualPlayer.specs.speed,
            attack: this.virtualPlayer.specs.attack,
            defense: this.virtualPlayer.specs.defense,
            attackBonus: this.virtualPlayer.specs.attackBonus,
            defenseBonus: this.virtualPlayer.specs.defenseBonus,
            movePoints: this.virtualPlayer.specs.speed,
            evasions: DEFAULT_EVASIONS,
            actions: DEFAULT_ACTIONS,
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
            nEvasions: 0,
            nLifeTaken: 0,
            nLifeLost: 0,
            nItemsUsed: 0,
        };
        const virtualPlayer: Player = {
            name: this.virtualPlayer.name,
            socketId: this.virtualPlayer.socketId,
            isActive: true,
            avatar: this.virtualPlayer.avatar,
            specs: playerSpecs,
            inventory: [],
            position: { x: 0, y: 0 },
            initialPosition: { x: 0, y: 0 },
            turn: 0,
            visitedTiles: [],
            profile: this.selectedProfile,
        };
        this.virtualPlayer = virtualPlayer;
    }
    closeModal(): void {
        this.closeProfileModal();
    }

    onSubmit(): void {
        this.assignRandomName();
        this.assignRandomAvatar();
        this.assignRandomLifeOrSpeedBonus();
        this.assignRandomAttackOrDefenseBonus();
        this.createVirtualSocketId();

        this.createVirtualPlayer();
        const joinGameData: JoinGameData = { player: this.virtualPlayer, gameId: this.gameId! };
        this.socketService.sendMessage(GameCreationEvents.JoinGame, joinGameData);
        this.closeProfileModal();
    }
}
