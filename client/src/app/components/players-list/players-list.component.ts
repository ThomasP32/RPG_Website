import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameCreationEvents, KickPlayerData } from '@common/events/game-creation.events';
import { Avatar, Player } from '@common/game';

@Component({
    selector: 'app-players-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './players-list.component.html',
    styleUrl: './players-list.component.scss',
})
export class PlayersListComponent implements OnInit {
    @Input() players: Player[];
    @Input() isHost: boolean;
    @Input() isGameMaxed: boolean;
    @Input() isGameLocked: boolean;
    @Input() gameId: string;
    @Input() openProfileModal: () => void;

    hostPlayerId: string = '';
    hoveredPlayerId: string | null = null;

    constructor(
        private readonly characterService: CharacterService,
        private readonly socketService: SocketService,
    ) {
        this.characterService = characterService;
        this.socketService = socketService;
    }

    ngOnInit(): void {
        if (this.isHost && this.players.length > 0) {
            this.hostPlayerId = this.players[0].socketId;
        }
    }

    getAvatarPreview(avatar: Avatar): string {
        return this.characterService.getAvatarPreview(avatar);
    }

    checkHostPlayerId(): void {
        if (!this.isHost || !this.hoveredPlayerId) return;
        if (this.hostPlayerId === '') {
            this.hostPlayerId = this.players[0]?.socketId || '';
        }
    }

    kickPlayer(playerId: string): void {
        const kickPlayer: KickPlayerData = { playerId: playerId, gameId: this.gameId };
        this.socketService.sendMessage(GameCreationEvents.KickPlayer, kickPlayer);
    }

    isVirtualPlayerSocketId(socketId: string): boolean {
        return !!socketId && socketId.includes('virtualPlayer');
    }
}
