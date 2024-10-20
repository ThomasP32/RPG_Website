import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Avatar, Player } from '@common/game';

interface Joueur {
    name: string;
    avatar: Avatar;
}
@Component({
    selector: 'app-players-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './players-list.component.html',
    styleUrl: './players-list.component.scss',
})
export class PlayersListComponent implements OnInit {
    players: Player[];
    playersMock: Joueur[] = [
        { name: 'Alistair', avatar: Avatar.Avatar1 },
        { name: 'Arachnoform', avatar: Avatar.Avatar2 },
        { name: 'Archibald', avatar: Avatar.Avatar3 },
        { name: 'Archpriest', avatar: Avatar.Avatar4 },
        { name: 'Cyron', avatar: Avatar.Avatar5 },
        { name: 'Magnus', avatar: Avatar.Avatar6 },
    ];
    gameId: string;
    private readonly route: ActivatedRoute = inject(ActivatedRoute);

    constructor(
        private socketService: SocketService,
        private characterService: CharacterService,
    ) {}

    ngOnInit(): void {
        this.getGameCode();
        this.socketService.sendMessage('getPlayers', this.gameId);
        this.socketService.listen<{ players: Player[] }>('playersLoaded').subscribe((data) => {
            this.players = data.players;
        });
    }

    getGameCode(): void {
        this.gameId = this.route.snapshot.params['gameId'];
    }

    getAvatarPreview(avatar: Avatar): string {
        return this.characterService.getAvatarPreview(avatar);
    }
}
