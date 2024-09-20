import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CreateGameComponent } from '@app/components/create-game/create-game.component';

@Component({
    selector: 'start-game-page',
    standalone: true,
    templateUrl: './start-game-page.component.html',
    styleUrls: ['./start-game-page.component.scss'],
    imports: [RouterOutlet, CreateGameComponent],
})
export class StartGamePageComponent {
}
