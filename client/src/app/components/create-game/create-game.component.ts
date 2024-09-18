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
    private readonly router: Router = inject(Router);

    // loadAvailableGames() {
    //     this.gameService.getVisibleGames().subscribe((games) => {
    //         this.availableGames = games;
    //     });
    // }

    // display list of mockData games
    loadMockAvailableGames() {
        this.gameService.getMockVisibleGames().subscribe((games) => {
            this.availableGames = games;
        });
    }
    ngOnInit(): void {
        this.loadMockAvailableGames();
    }

    // redirects organizer to character creation form if available
    // if not available, error message
    // selectGame(game: { id: string; name: string; mapSize: number; gameMode: string; mapPreview: string; lastModified: string }) {
    //     this.gameService.checkGameAvailability(game.id).subscribe((isAvailable) => {
    //         if (isAvailable) {
    //             this.router.navigate(['/create-character', game.id]);
    //         } else {
    //             this.errorMessage = 'The selected game is unavailable. Please choose another game.';
    //         }
    //     });
    // }

    // mockData implementation
    selectGame(game: Game) {
        this.gameService.checkMockGameAvailability(game.name).subscribe((isAvailable) => {
            if (isAvailable) {
                this.router.navigate(['/waiting-room']);
            } else {
                this.errorMessage = 'The selected game is unavailable. Please choose another game.';
            }
        });
    }
}
