import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameDataService } from '@app/services/game-data.service';
import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { GameService } from '@app/services/game/game.service';
import { ImageService } from '@app/services/image/image.service';
import { CombatEvents, StartCombatData } from '@common/events/combat.events';
import { Player } from '@common/game';
import { Cell } from '@common/map-cell';
import { DoorTile, ItemCategory, Tile } from '@common/map.types';
import { CombatListComponent } from '../combat-list/combat-list.component';
import { DoorSelectorComponent } from '../door-selector/door-selector.component';

@Component({
    selector: 'app-actions-component',
    standalone: true,
    imports: [CommonModule, CombatListComponent, DoorSelectorComponent],
    templateUrl: './actions-component.component.html',
    styleUrl: './actions-component.component.scss',
})
export class ActionsComponentComponent implements OnInit {
    @Input() player: Player;
    @Input() currentPlayerTurn: string;
    @Output() showExitModalChange = new EventEmitter<boolean>();

    surroundingMap: Cell[][] = [];
    possibleDoors: DoorTile[] = [];
    possibleOpponents: Player[] = [];
    possibleWalls: Tile[] = [];

    doorActionAvailable: boolean = false;
    breakWallActionAvailable: boolean = false;
    combatAvailable: boolean = false;

    showExitModal: boolean = false;
    showCombatModal: boolean = false;
    showDoorSelector: boolean = false;
    actionDescription: string | null = null;

    doorMessage: string = 'Ouvrir la porte';

    constructor(
        protected readonly gameTurnService: GameTurnService,
        private readonly socketService: SocketService,
        private readonly gameService: GameService,
        protected readonly imageService: ImageService,
        private readonly gameDataService: GameDataService,
    ) {
        this.gameTurnService = gameTurnService;
        this.socketService = socketService;
        this.gameService = gameService;
        this.imageService = imageService;
        this.gameDataService = gameDataService;
    }

    ngOnInit(): void {
        this.listenForPossibleOpponents();
        this.listenForDoorOpening();
        this.listenForWallBreaking();
        this.gameDataService.surroundingMap$.subscribe((map) => {
            this.surroundingMap = map;
        });
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
                this.showDoorSelector = true;
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

    isWallBreakerAvailable(): boolean {
        return this.player.inventory.includes(ItemCategory.WallBreaker);
    }

    thisPlayerTurn(): boolean {
        return this.currentPlayerTurn === this.player.name;
    }

    onShowCombatModalChange(newValue: boolean) {
        this.showCombatModal = newValue;
    }

    onShowDoorSelectorChange(newValue: boolean) {
        this.showDoorSelector = newValue;
    }
}
