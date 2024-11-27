import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ImageService } from '@app/services/image/image.service';
import { Player } from '@common/game';

@Component({
    selector: 'app-actions-component',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './actions-component.component.html',
    styleUrl: './actions-component.component.scss',
})
export class ActionsComponentComponent {
    @Input() player: Player;
    actionDescription: string | null = null;

    constructor(protected readonly imageService: ImageService) {
        this.imageService = imageService;
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
    toggleDoor(): void {
        console.log('toggleDoor');
    }
    breakWall(): void {
        console.log('breakWall');
    }
    endTurn(): void {
        console.log('endTurn');
    }
    quitGame(): void {
        console.log('quitGame');
    }
}
