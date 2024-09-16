import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Coordinate } from '@app/interfaces/coordinate';
import { DoorTile } from '@app/interfaces/door-tile';
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
    selectGame(game: {
        _id: string;
        name: string;
        mapSize: Coordinate;
        startTiles: Coordinate[];
        attributeItem1: Coordinate;
        attributeItem2: Coordinate;
        conditionItem1: Coordinate;
        conditionItem2: Coordinate;
        functionItem1: Coordinate;
        functionItem2: Coordinate;
        waterTiles: Coordinate[];
        iceTiles: Coordinate[];
        wallTiles: Coordinate[];
        doorTiles: DoorTile[];
        isVisible: boolean;
    }) {
        this.gameService.checkGameAvailability(game._id).subscribe((isAvailable) => {
            if (isAvailable) {
                this.router.navigate(['/create-character', game._id]);
            } else {
                this.errorMessage = 'The selected game is unavailable. Please choose another game.';
            }
        });
    }
}
