import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CombatService } from '@app/services/combat/combat.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { GameService } from '@app/services/game/game.service';
import { CombatEvents, StartCombatData } from '@common/events/combat.events';
import { Player } from '@common/game';
import { DoorTile, Tile } from '@common/map.types';

@Component({
    selector: 'app-actions-component',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './actions-component.component.html',
    styleUrl: './actions-component.component.scss',
})
export class ActionsComponentComponent implements OnInit {
    @Input() player: Player;
    @Input() currentPlayerTurn: string;
    @Output() showExitModalChange = new EventEmitter<boolean>();
    possibleDoors: DoorTile[] = [];
    possibleOpponents: Player[] = [];
    possibleWalls: Tile[] = [];

    doorActionAvailable: boolean = false;
    breakWallActionAvailable: boolean = false;
    combatAvailable: boolean = false;

    showExitModal: boolean = false;
    showCombatModal: boolean = false;
    showDoorModal: boolean = false;
    actionDescription: string | null = null;

    doorMessage: string = 'Ouvrir la porte';

    constructor(
        protected readonly gameTurnService: GameTurnService,
        private readonly socketService: SocketService,
        private readonly gameService: GameService,
        private readonly combatService: CombatService,
    ) {
        this.gameTurnService = gameTurnService;
        this.socketService = socketService;
        this.gameService = gameService;
        this.combatService = combatService;
    }

    ngOnInit(): void {
        this.listenForPossibleOpponents();
        this.listenForDoorOpening();
        this.listenForWallBreaking();
        this.listenForIsCombatModalOpen();
    }

    showDescription(description: string) {
        this.actionDescription = description;
    }

    hideDescription() {
        this.actionDescription = null;
    }

    fight(): void {
        if (this.combatAvailable) {
            if (this.possibleOpponents.length === 1) {
                const startCombatData: StartCombatData = { gameId: this.gameService.game.id, opponent: this.possibleOpponents[0] };
                this.socketService.sendMessage(CombatEvents.StartCombat, startCombatData);
            } else {
                this.showCombatModal = true;
            }
        }
    }
    toggleDoor() {
        if (this.doorActionAvailable) {
            if (this.possibleDoors.length === 1) {
                this.gameTurnService.toggleDoor(this.possibleDoors[0]);
            } else {
                this.showDoorModal = true;
            }
        }
    }
    breakWall(): void {
        if (this.breakWallActionAvailable) {
            this.gameTurnService.breakWall(this.possibleWalls[0]);
        }
    }
    endTurn() {
        this.gameTurnService.endTurn();
    }
    openExitConfirmationModal(): void {
        this.showExitModal = true;
        this.showExitModalChange.emit(this.showExitModal);
    }

    private listenForPossibleOpponents() {
        this.gameTurnService.possibleOpponents$.subscribe((possibleOpponents: Player[]) => {
            if (this.player.specs.actions > 0 && possibleOpponents.length > 0) {
                this.combatAvailable = true;
                this.possibleOpponents = possibleOpponents;
            } else {
                this.combatAvailable = false;
                this.possibleOpponents = [];
            }
        });
    }

    private listenForDoorOpening() {
        this.gameTurnService.possibleDoors$.subscribe((doors) => {
            if (!this.gameTurnService.possibleActions.door) {
                this.doorActionAvailable = false;
                this.possibleDoors = [];
            } else if (doors.length > 0) {
                this.doorActionAvailable = true;
                this.possibleDoors = doors;
            }
        });
    }

    private listenForWallBreaking() {
        this.gameTurnService.possibleWalls$.subscribe((walls) => {
            if (walls.length > 0) {
                this.breakWallActionAvailable = true;
                this.possibleWalls = walls;
            } else {
                this.doorActionAvailable = false;
                this.possibleWalls = [];
            }
        });
    }

    private listenForIsCombatModalOpen() {
        this.combatService.isCombatModalOpen$.subscribe((isCombatModalOpen) => {
            this.showCombatModal = isCombatModalOpen;
            if (isCombatModalOpen) {
                this.gameTurnService.clearMoves();
                this.combatAvailable = false;
            }
        });
    }

    thisPlayerTurn(): boolean {
        return this.currentPlayerTurn === this.player.name;
    }
}
