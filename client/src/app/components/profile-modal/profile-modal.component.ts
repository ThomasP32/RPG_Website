import { Component, Input } from '@angular/core';
import { WaitingRoomPageComponent } from '@app/pages/waiting-room-page/waiting-room-page.component';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Avatar, BotName, Player } from '@common/game';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-profile-modal',
    standalone: true,
    imports: [],
    templateUrl: './profile-modal.component.html',
    styleUrl: './profile-modal.component.scss',
})
export class ProfileModalComponent {
    subscription: Subscription;
    @Input() activePlayers: Player[] = [];
    selectedProfile: string;
    gameId: string | null = null;

    constructor(
        private playerService: PlayerService,
        private socketService: SocketService,
        private waitingRoom: WaitingRoomPageComponent,
    ) {}

    setProfile(profile: string): void {
        this.selectedProfile = profile;
        console.log('Selected profile:', profile);
    }

    assignRandomName(): void {
        const availableNames = Object.values(BotName).filter((value) => typeof value === 'string') as string[];
        const usedNames = this.activePlayers.map((player) => player.name);
        const unusedNames = availableNames.filter((name) => !usedNames.includes(name));
        this.playerService.player.name = unusedNames[Math.floor(Math.random() * unusedNames.length)];
    }

    assignRandomAvatar(): void {
        const availableAvatars = Object.values(Avatar).filter((value) => typeof value === 'number') as number[];
        const usedAvatars = this.activePlayers.map((player) => player.avatar);
        const unusedAvatars = availableAvatars.filter((avatar) => !usedAvatars.includes(avatar));
        this.playerService.player.avatar = unusedAvatars[Math.floor(Math.random() * unusedAvatars.length)];
    }

    assignRandomLifeOrSpeedBonus(): void {
        const type: 'life' | 'speed' = Math.random() < 0.5 ? 'life' : 'speed';
        this.playerService.assignBonus(type);
    }

    assignRandomAttackOrDefenseBonus(): void {
        const type: 'attack' | 'defense' = Math.random() < 0.5 ? 'attack' : 'defense';
        this.playerService.assignDice(type);
    }

    createVirtualPlayer(): void {
        this.socketService.listen<Player[]>('currentPlayers').subscribe((players: Player[]) => {
            this.activePlayers = players;
        });
        this.assignRandomName();
        this.assignRandomAvatar();
        this.assignRandomLifeOrSpeedBonus();
        this.assignRandomAttackOrDefenseBonus();

        this.playerService.createPlayer();
        this.socketService.sendMessage('joinGame', { player: this.playerService.player, gameId: this.gameId });

        this.waitingRoom.closeProfileModal();

        console.log('Player created:', this.playerService.player);
    }
}
