import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameService } from '@app/services/game.service';
import { Map } from 'src/app/interfaces/map';

@Component({
    selector: 'app-create-game',
    standalone: true,
    templateUrl: './create-game.component.html',
    styleUrls: ['./create-game.component.scss'],
    imports: [FormsModule, CommonModule],
})
export class CreateGameComponent {
    availableGames: Map[] = [];
    errorMessage: string = '';
    map: Map;

    private readonly gameService: GameService = inject(GameService);
    private readonly router: Router = inject(Router);

    loadAvailableGames() {
        this.gameService.getVisibleGames().subscribe((games) => {
            this.availableGames = games;
        });
    }

    selectGame(game: { id: string; name: string; mapSize: number; gameMode: string; mapPreview: string; lastModified: string }) {
        this.gameService.checkGameAvailability(game.id).subscribe((isAvailable) => {
            if (isAvailable) {
                this.router.navigate(['/create-character', game.id]);
            } else {
                this.errorMessage = 'The selected game is unavailable. Please choose another game.';
            }
        });
    }

    // display list of mockData games
    // loadMockAvailableGames() {
    //     this.gameService.getMockVisibleGames().subscribe((games) => {
    //         this.availableGames = games;
    //     });
    // }
    // ngOnInit(): void {
    //     this.loadMockAvailableGames();
    // }

    // mockData implementation
    // selectGame(game: Game) {
    //     this.gameService.checkMockGameAvailability(game.name).subscribe((isAvailable) => {
    //         if (isAvailable) {
    //             this.router.navigate(['/waiting-room']);
    //         } else {
    //             this.errorMessage = 'The selected game is unavailable. Please choose another game.';
    //         }
    //     });
    // }
}
