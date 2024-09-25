import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommunicationService } from '@app/services/communication.map.service';
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

<<<<<<< HEAD
    constructor(
        readonly communicationService: CommunicationService,
        private readonly router: Router,
    ) {
        this.communicationService.maps$.subscribe((maps) => (this.availableMaps = maps.filter((map) => map.isVisible)));
        this.router = router;
=======
    // constructor(readonly communicationService: CommunicationService, private readonly router: Router) {
    //     this.communicationService.maps$.subscribe((maps) => (this.availableMaps = maps.filter(map => map.isVisible)));
    //     this.router = router;
    // }

    constructor(
        private router: Router,
        private communicationService: CommunicationService,
    ) {
        this.communicationService.maps$.subscribe((maps) => {
            this.maps = maps;
        });
>>>>>>> feature/map-edition
    }

    ngOnInit(): void {
        this.communicationService.getMapsFromServer();
    }

    loadAvailableMaps() {
        //     this.communicationService.getMapsFromServer()
        //     .subscribe((maps) => {
        //         this.availableMaps = maps;
        //     });
        // }
        // selectMap(map: { id: string; name: string; description: string; mapSize: number; gameMode: string }) {
        //     this.communicationService.checkMapAvailability(map.id).subscribe((isAvailable) => {
        //         if (isAvailable) {
        //             this.router.navigate(['/create-character', map.id]);
        //         } else {
        //             this.errorMessage = 'The selected game is unavailable. Please choose another game.';
        //         }
        //     });
    }

    selectMap(mapName: string) {
<<<<<<< HEAD
        const params = new URLSearchParams();
        if (this.availableMaps.some((map) => map.name === mapName)) {
            if (this.map._id != undefined) {
                params.set('mapId', this.map._id);
                window.location.href = `/character-creation/id=${this.map._id}`;
            }
=======
        if (this.availableMaps.some((map) => map.name === mapName)) {
            this.router.navigate(['/create-character']);
>>>>>>> feature/map-edition
        } else {
            this.errorMessage = 'The selected game is unavailable. Please choose another game.';
        }
    }

    playGame() {
        this.router.navigate(['/create-character']);
    }

    // display list of mockData games
    //     loadMockAvailableGames() {
    //         this.communicationService.getMockVisibleGames().subscribe((games) => {
    //             this.availableGames = games;
    //      });
    //     }
    //     ngOnInit(): void {
    //         this.loadMockAvailableGames();
    //     }

    //     mockData implementation
    //     selectGame(game: Game) {
    //         this.communicationService.checkMockGameAvailability(game.name).subscribe((isAvailable) => {
    //             if (isAvailable) {
    //                 this.router.navigate(['/waiting-room']);
    //             } else {
    //                 this.errorMessage = 'The selected game is unavailable. Please choose another game.';
    //             }
    //         });
    //     }
}
