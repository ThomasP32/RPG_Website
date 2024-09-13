import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '@app/services/game.service';
import { Game } from 'src/app/interfaces/vec2';

@Component({
    selector: 'app-create-game',
    standalone: true,
    template: `<div class="create-game-view">
        <h2>Create a New Game</h2>

        <div class="game-list">
            <div *ngFor="let game of availableGames" class="game-item" (click)="selectGame(game)">
                <h3>{{ game.name }}</h3>
                <p>Map Size: {{ game.mapSize }}</p>
                <p>Mode: {{ game.mode }}</p>
            </div>
        </div>
    </div>`,
    templateUrl: './create-game.component.html',
    styleUrls: ['./create-game.component.scss'],
})
export class CreateGameComponent {
    availableGames: Game[] = [];
    errorMessage: string = '';
    game: Game;

    private readonly gameService: GameService = inject(GameService);
    private readonly router: Router;

    // display the list of available games
    loadAvailableGames() {
        this.gameService.getVisibleGames().subscribe((games) => {
            this.availableGames = games;
        });
    }

    // redirects organizer to character creation form if available
    // if not available, error message
    selectGame(game: { id: number; name: string; isVisible: boolean }) {
        this.gameService.checkGameAvailability(game.id).subscribe((isAvailable) => {
            if (isAvailable) {
                this.router.navigate(['/create-character', game.id]);
            } else {
                this.errorMessage = 'The selected game is unavailable. Please choose another game.';
            }
        });
    }
}
