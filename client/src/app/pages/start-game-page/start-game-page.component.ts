import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommunicationMapService } from '@app/services/communication.map.service';
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

    constructor(private communicationMapService: CommunicationMapService) {
        this.communicationMapService.maps$.subscribe((maps) => {
            this.maps = maps;
        });
    }

    ngOnInit(): void {
        this.communicationMapService.getMapsFromServer();
    }

    selectMap(mapId: string) {
        console.log('selecting map', mapId);
        this.selectedMap = mapId;
    }

    next(mapId: string) {
        const params = new URLSearchParams();
        if (this.selectedMap) {
            params.set('id', this.selectedMap);
            window.location.href = `/create-character/${params}`;
        } else {
            this.errorMessage = 'The selected game is unavailable. Please choose another game.';
        }
    }
}
