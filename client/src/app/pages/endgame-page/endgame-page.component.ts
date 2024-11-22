import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { EndgameService } from '@app/services/endgame/endgame.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Avatar, Game, Player } from '@common/game';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-endgame-page',
    standalone: true,
    imports: [ChatroomComponent],
    templateUrl: './endgame-page.component.html',
    styleUrl: './endgame-page.component.scss',
})
export class EndgamePageComponent implements OnDestroy {
    socketSubscription: Subscription = new Subscription();

    isSortingAsc = true;

    constructor(
        private socketService: SocketService,
        private gameService: GameService,
        private playerService: PlayerService,
        private characterService: CharacterService,
        private router: Router,
        protected endgameService: EndgameService,
    ) {
        this.socketService = socketService;
        this.gameService = gameService;
        this.playerService = playerService;
        this.characterService = characterService;
        this.router = router;
        this.endgameService = endgameService;
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

    getAvatarPreview(avatar: Avatar): string {
        return this.characterService.getAvatarPreview(avatar);
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
