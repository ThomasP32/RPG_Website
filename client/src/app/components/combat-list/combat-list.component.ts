import { Component, Input, OnChanges } from '@angular/core';
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
export class CombatListComponent implements OnChanges {
    @Input() possibleOpponents: Player[] = [];
    combatAlreadyStarted = false;

    constructor(
        private readonly socketService: SocketService,
        private readonly gameService: GameService,
    ) {
        this.socketService = socketService;
        this.gameService = gameService;
    }

    ngOnChanges() {
        this.combatAlreadyStarted = false;
    }

    attack(opponent: Player): void {
        if (!this.combatAlreadyStarted) {
            this.socketService.sendMessage('startCombat', { gameId: this.gameService.game.id, opponent: opponent });
            this.combatAlreadyStarted = true;
        }
    }
}
