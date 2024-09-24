import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommunicationService } from '@app/services/communication.map.service';
import { Map } from '@common/map.types';

@Component({
    selector: 'start-game-page',
    standalone: true,
    templateUrl: './start-game-page.component.html',
    styleUrls: ['./start-game-page.component.scss'],
    imports: [CommonModule, RouterLink],
})
export class StartGamePageComponent {
    availableMaps: Map[] = [];
    errorMessage: string = '';
    map: Map;
    maps: Map[] = [];
    selectedMap: string = '';

    constructor(
        private router: Router,
        private communicationService: CommunicationService,
    ) {
        this.communicationService.maps$.subscribe((maps) => {
            this.maps = maps;
        });
    }

    ngOnInit(): void {
        this.communicationService.getMapsFromServer();
    }

    selectMap(mapName: string) {
        console.log('selecting map', mapName);
        this.selectedMap = mapName;
    }

    next(mapName: string) {
        console.log('going next', mapName);
        if (this.availableMaps.some((map) => map.name === mapName)) {
            this.selectedMap = mapName;
            console.log('going next', mapName);
            this.router.navigate(['/create-character']);
        } else {
            this.errorMessage = 'The selected game is unavailable. Please choose another game.';
        }
    }
}
