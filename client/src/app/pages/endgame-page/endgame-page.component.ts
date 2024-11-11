import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Game, Player } from '@common/game';
import { Subscription } from 'rxjs';
import { ChatroomComponent } from '../../components/chatroom/chatroom.component';

@Component({
    selector: 'app-endgame-page',
    standalone: true,
    imports: [ChatroomComponent],
    templateUrl: './endgame-page.component.html',
    styleUrl: './endgame-page.component.scss',
})
export class EndgamePageComponent {
    socketSubscription: Subscription = new Subscription();

    playerUrls: Map<string, string> = new Map<string, string>();

    constructor(
        private socketService: SocketService,
        private gameService: GameService,
        private playerService: PlayerService,
        private characterService: CharacterService,
        private router: Router,
    ) {
        this.socketService = socketService;
        this.gameService = gameService;
        this.playerService = playerService;
        this.characterService = characterService;
        this.router = router;
    }

    async ngOnInit() {
        for (let player of this.players) {
            const avatarUrl = await this.characterService.getAvatarPreview(player.avatar);
            this.playerUrls.set(player.socketId, avatarUrl);
        }
    }

    get player(): Player {
        return this.playerService.player;
    }

    get game(): Game {
        return this.gameService.game;
    }

    get players(): Player[] {
        return this.gameService.game.players;
    }

    navigateToMain(): void {
        this.playerService.resetPlayer();
        this.characterService.resetCharacterAvailability();
        this.router.navigate(['/main-menu']);
    }

    ngOnDestroy() {
        if (this.socketSubscription) {
            this.socketSubscription.unsubscribe();
        }
        this.socketService.disconnect();
    }
}
