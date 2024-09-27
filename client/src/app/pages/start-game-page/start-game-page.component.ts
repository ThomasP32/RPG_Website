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
    selectedMap: string | undefined = undefined;

    constructor(private communicationMapService: CommunicationMapService) {
        this.communicationMapService.maps$.subscribe((maps) => {
            this.maps = maps;
        });
    }

    ngOnInit(): void {}

    //     selectMap(mapId: string | undefined) {
    //         this.selectedMap = mapId;
    //     }

    //     next(mapId: string | undefined) {
    //         if (this.selectedMap) {
    //             const chosenMap = this.maps.find((map) => map._id === this.selectedMap);
    //             if (chosenMap && chosenMap.isVisible) {
    //                 const params = new URLSearchParams();
    //                 params.set('id', this.selectedMap);
    //                 window.location.href = `/create-character/${params}`;
    //             } else {
    //                 this.showErrorMessage.selectionError = true;
    //             }
    //         } else {
    //             this.showErrorMessage.userError = true;
    //         }
    //     }
}
