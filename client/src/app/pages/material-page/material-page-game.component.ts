import { Component, OnInit } from '@angular/core';
import { CommunicationService } from '@app/services/communication.game.service';
import { Game } from '@common/game.type';


@Component({
    selector: 'app-material-page',
    standalone: true,
    templateUrl: './material-page-game.component.html',
    styleUrls: ['./material-page.component.scss'],
    imports: [],
})
export class MaterialPageGameComponent implements OnInit {
    constructor(readonly communicationService: CommunicationService) {}

    getGamesFromServer(): void {
        this.communicationService.basicGet().subscribe({
            next: (games: Game[]) => {
                this.communicationService.games.next(games);
            },
        });
    }

    ngOnInit(): void {
        this.getGamesFromServer();
    }
}
