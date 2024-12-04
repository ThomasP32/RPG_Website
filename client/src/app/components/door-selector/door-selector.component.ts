import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { ImageService } from '@app/services/image/image.service';
import { Avatar } from '@common/game';
import { Cell } from '@common/map-cell';
import { Coordinate, DoorTile, ItemCategory, TileCategory } from '@common/map.types';

@Component({
    selector: 'app-door-selector',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './door-selector.component.html',
    styleUrls: ['./door-selector.component.scss'],
})
export class DoorSelectorComponent {
    @Input() surroundingMap: Cell[][];
    @Input() possibleDoors!: DoorTile[];
    @Input() playerPosition!: Coordinate;
    @Output() showDoorSelectorChange = new EventEmitter<boolean>();

    constructor(
        private readonly imageService: ImageService,
        private readonly gameTurnService: GameTurnService,
    ) {
        this.imageService = imageService;
        this.gameTurnService = gameTurnService;
    }
    onDoorClick(alternateCoordinates: Coordinate): void {
        const coordinate = this.surroundingMap[alternateCoordinates.x][alternateCoordinates.y].coordinate;

        const door = this.possibleDoors.find((door) => door.coordinate.x === coordinate.x && door.coordinate.y === coordinate.y);
        if (door) {
            this.gameTurnService.toggleDoor(door);
            this.showDoorSelectorChange.emit(false);
        }
    }

    isDoor(alternateCoordinates: Coordinate): boolean {
        const coordinate = this.surroundingMap[alternateCoordinates.x][alternateCoordinates.y].coordinate;
        return this.possibleDoors.some((door) => door.coordinate.x === coordinate.x && door.coordinate.y === coordinate.y);
    }
    getTileImage(tileType: TileCategory, rowIndex: number, colIndex: number): string {
        if (tileType === TileCategory.Door && this.surroundingMap[rowIndex][colIndex].door.isDoor) {
            return this.imageService.getDoorImage(this.surroundingMap[rowIndex][colIndex].door.isOpen);
        } else return this.imageService.getTileImage(tileType);
    }

    getStartingPointImage(): string {
        return this.imageService.getStartingPointImage();
    }

    getItemImage(item: ItemCategory): string {
        return this.imageService.getItemImage(item);
    }

    getAvatarImage(avatar: Avatar): string {
        return this.imageService.getPixelatedPlayerImage(avatar);
    }
    rowByIndex(index: number) {
        return index;
    }

    cellByIndex(index: number) {
        return index;
    }

    closeModal() {
        this.showDoorSelectorChange.emit(false);
    }
}
