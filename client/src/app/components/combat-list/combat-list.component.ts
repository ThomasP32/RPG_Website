import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameService } from '@app/services/game/game.service';
import { CombatEvents, StartCombatData } from '@common/events/combat.events';
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
    @Output() showCombatModalChange = new EventEmitter<boolean>();
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
            const startCombatData: StartCombatData = { gameId: this.gameService.game.id, opponent: opponent };
            this.socketService.sendMessage(CombatEvents.StartCombat, startCombatData);
            this.combatAlreadyStarted = true;
            this.showCombatModalChange.emit(false);
        }
    }

    closeModal(): void {
        this.showCombatModalChange.emit(false);
    }
}
