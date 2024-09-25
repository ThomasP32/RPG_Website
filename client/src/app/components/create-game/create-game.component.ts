import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommunicationMapService } from '@app/services/communication.map.service';
import { Map } from '@common/map.types';

@Component({
    selector: 'app-create-game',
    standalone: true,
    templateUrl: './create-game.component.html',
    styleUrls: ['./create-game.component.scss'],
    imports: [FormsModule, CommonModule, RouterLink],
})
export class CreateGameComponent implements OnInit {
    availableMaps: Map[] = [];
    errorMessage: string = '';
    map: Map;
    maps: Map[] = [];

    // constructor(readonly communicationMapService: CommunicationMapService, private readonly router: Router) {
    //     this.communicationMapService.maps$.subscribe((maps) => (this.availableMaps = maps.filter(map => map.isVisible)));
    //     this.router = router;
    // }

    constructor(
        private router: Router,
        private communicationMapService: CommunicationMapService,
    ) {
        this.communicationMapService.maps$.subscribe((maps) => {
            this.maps = maps;
        });
    }

    ngOnInit(): void {
        this.communicationMapService.getMapsFromServer();
    }

    loadAvailableMaps() {
        //     this.communicationMapService.getMapsFromServer()
        //     .subscribe((maps) => {
        //         this.availableMaps = maps;
        //     });
        // }
        // selectMap(map: { id: string; name: string; description: string; mapSize: number; gameMode: string }) {
        //     this.communicationMapService.checkMapAvailability(map.id).subscribe((isAvailable) => {
        //         if (isAvailable) {
        //             this.router.navigate(['/create-character', map.id]);
        //         } else {
        //             this.errorMessage = 'The selected game is unavailable. Please choose another game.';
        //         }
        //     });
    }

    selectMap(mapName: string) {
        if (this.availableMaps.some((map) => map.name === mapName)) {
            this.router.navigate(['/create-character']);
        } else {
            this.errorMessage = 'The selected game is unavailable. Please choose another game.';
        }
    }

    playGame() {
        this.router.navigate(['/create-character']);
    }

    // display list of mockData games
    //     loadMockAvailableGames() {
    //         this.communicationMapService.getMockVisibleGames().subscribe((games) => {
    //             this.availableGames = games;
    //      });
    //     }
    //     ngOnInit(): void {
    //         this.loadMockAvailableGames();
    //     }

    //     mockData implementation
    //     selectGame(game: Game) {
    //         this.communicationMapService.checkMockGameAvailability(game.name).subscribe((isAvailable) => {
    //             if (isAvailable) {
    //                 this.router.navigate(['/waiting-room']);
    //             } else {
    //                 this.errorMessage = 'The selected game is unavailable. Please choose another game.';
    //             }
    //         });
    //     }
}
