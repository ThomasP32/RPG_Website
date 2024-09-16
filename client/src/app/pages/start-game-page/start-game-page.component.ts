import { Component } from '@angular/core';
import { CreateGameComponent } from '@app/components/create-game/create-game.component';

@Component({
    selector: 'app-start-game-page',
    standalone: true,
    templateUrl: './start-game-page.component.html',
    styleUrls: ['./start-game-page.component.scss'],
    imports: [CreateGameComponent],
})
export class StartGamePageComponent {}
