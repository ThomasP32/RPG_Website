import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MapComponent } from '@app/components/map/map.component';
import { CommunicationService } from '@app/services/communication.map.service';
import { Map } from '@common/map.types';

@Component({
    selector: 'app-admin-page',
    standalone: true,
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [RouterLink, MapComponent],
})
export class AdminPageComponent implements OnInit {
    readonly title: string = 'Maps Administration';
    maps: Map[] = [];

    constructor(
        private router: Router,
        private communicationService: CommunicationService,
    ) {
        this.communicationService.maps$.subscribe((maps) => {
            this.maps = maps;
        });
    }

    @ViewChild(MapComponent, { static: false }) mapComponent!: MapComponent;

    isMapVisible = false;

    toggleGameCreationModalVisibility(): void {
        this.isMapVisible = true;
    }

    onCloseModal(): void {
        this.isMapVisible = false;
    }

    ngOnInit(): void {
        this.communicationService.getMapsFromServer();
    }

    navigateToMain(): void {
        this.router.navigate(['/mainmenu']);
    }

    editGame(map: Map): void {
        if (map._id) {
            window.location.href = `/game-creation/${map._id}`;
        }
    }

    deleteGame(): void {
        if (confirm('Are you sure you want to delete this game ?')) {
            // this.gameService.deleteGame(game.id).subscribe(() => {
            //     this.loadGames();
            // });
        }
    }

    // showDescription(): void {

    // }

    // hideDescription(): void {
    //     // game.showDescription = false
    // }

    toggleVisibility(): void {
        // const game = this.games.find(g => g.id === game.id);
        // if (game) {
        //     game.visible = !game.visible;
        //     this.gameService.updateGame(game).subscribe(() => {
        //         console.log('Game visibility updated');
        //     });
        // }
    }
}
