import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
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
    hostPlayerId: string = '';
    hoveredPlayerId: string | null = null;

    constructor(
        private characterService: CharacterService,
        private socketService: SocketService,
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
        this.socketService.sendMessage('kickPlayer', playerId);
    }

    addVirtualPlayer(): void {
        // if (!this.isGameMaxed()) {
        //     const virtualPlayer: Player;
        //     this.activePlayers.push(virtualPlayer);
        //
    }
}
