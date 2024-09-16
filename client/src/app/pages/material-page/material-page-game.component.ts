import { Component, OnInit} from '@angular/core';
import { CommunicationService } from '@app/services/communication.game.service';
import { Game } from '@common/game.type';


@Component({
    selector: 'app-material-page',
    standalone: true,
    templateUrl: './material-page-game.component.html',
    styleUrls: ['./material-page.component.scss'],
    imports: [],
})
export class MaterialPageGameComponent implements OnInit{
    games: Game[] = [];
    constructor(readonly communicationService: CommunicationService) {
        this.communicationService.games$.subscribe(((games) => this.games = games));
    }

    ngOnInit(): void {
        this.communicationService.getGamesFromServer();
    }
}