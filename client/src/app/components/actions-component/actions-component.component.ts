import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { Player } from '@common/game';
import { DoorTile } from '@common/map.types';

@Component({
    selector: 'app-actions-component',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './actions-component.component.html',
    styleUrl: './actions-component.component.scss',
})
export class ActionsComponentComponent implements OnInit, OnDestroy {
    @Input() player: Player;
    @Output() showExitModalChange = new EventEmitter<boolean>();
    possibleDoors: DoorTile[];
    possibleOpponents: Player[];
    doorActionAvailable: boolean = false;
    breakWallAvailable: boolean = false;
    combatAvailable: boolean = false;

    showExitModal: boolean = false;
    actionDescription: string | null = null;

    doorMessage: string = 'Ouvrir la porte';
    // this.actionMessage = doors[0].isOpened ? 'Fermer la porte' : 'Ouvrir la porte';

    constructor(private readonly gameTurnService: GameTurnService) {
        this.gameTurnService = gameTurnService;
    }
    ngOnDestroy(): void {
        throw new Error('Method not implemented.');
    }
    ngOnInit(): void {
        this.listenForPossibleOpponents();
        this.listenForDoorOpening();
        this.listenForWallBreaking();
    }

    showDescription(description: string) {
        this.actionDescription = description;
    }

    hideDescription() {
        this.actionDescription = null;
    }

    fight(): void {
        console.log('fight');
    }
    toggleDoor() {
        if (this.doorActionAvailable) {
            this.gameTurnService.toggleDoor(this.possibleDoors[0]);
        }
    }
    breakWall(): void {
        console.log('breakWall');
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
            if (this.gameTurnService.doorAlreadyToggled) {
                this.doorActionAvailable = false;
                this.possibleDoors = [];
            } else if (doors.length > 0) {
                this.doorActionAvailable = true;
                this.possibleDoors = doors;
            } else {
                this.doorActionAvailable = false;
                this.possibleDoors = [];
            }
        });
    }
    private listenForWallBreaking() {
        this.gameTurnService.possibleWalls$.subscribe((walls) => {
            if (walls.length > 0) {
                this.breakWallAvailable = true;
            }
        });
    }
}
