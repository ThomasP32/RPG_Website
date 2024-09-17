import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameService } from '@app/services/game.service';
import { Game } from 'src/app/interfaces/game';

@Component({
    selector: 'app-create-game',
    standalone: true,
    templateUrl: './create-game.component.html',
    styleUrls: ['./create-game.component.scss'],
    imports: [FormsModule, CommonModule],
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

    selectedGame?: Game;
    viewGameDetails(game: Game) {
        this.selectedGame = game;
    }

    // redirects organizer to character creation form if available
    // if not available, error message
    selectGame(game: { id: string; name: string; mapSize: number; gameMode: string; mapPreview: string; lastModified: string }) {
        this.gameService.checkGameAvailability(game.id).subscribe((isAvailable) => {
            if (isAvailable) {
                this.router.navigate(['/create-character', game.id]);
            } else {
                this.errorMessage = 'The selected game is unavailable. Please choose another game.';
            }
        });
    }
}
