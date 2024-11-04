import { Component, Input } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameService } from '@app/services/game/game.service';
import { Player } from '@common/game';

@Component({
    selector: 'app-combat-list',
    standalone: true,
    imports: [],
    templateUrl: './combat-list.component.html',
    styleUrl: './combat-list.component.scss',
})
export class CombatListComponent {
    @Input() possibleOpponents: Player[] = [];

    constructor(
        private socketService: SocketService,
        private gameService: GameService,
    ) {
        this.socketService = socketService;
        this.gameService = gameService;
    }

    attack(opponent: Player): void {
        this.socketService.sendMessage('startCombat', { gameId: this.gameService.game.id, opponent: opponent });
    }
}
