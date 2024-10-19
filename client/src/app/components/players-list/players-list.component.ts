import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'app-players-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './players-list.component.html',
    styleUrl: './players-list.component.scss',
})
export class PlayersListComponent {
    players = [
        { name: 'Player 1', avatar: 'avatar1.jpg', status: 'Ready' },
        { name: 'Player 2', avatar: 'avatar2.jpg', status: 'Waiting' },
    ];
}
