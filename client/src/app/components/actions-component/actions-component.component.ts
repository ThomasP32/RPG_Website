import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'app-actions-component',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './actions-component.component.html',
    styleUrl: './actions-component.component.scss',
})
export class ActionsComponentComponent {
    isOpened = false; // État pour gérer l'ouverture/fermeture

    toggleActions(): void {
        this.isOpened = !this.isOpened; // Alterne entre ouvert et fermé
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
}
