import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommunicationMapService } from '@app/services/communication.map.service';
import { Map } from '@common/map.types';

@Component({
    selector: 'game-choice-page',
    standalone: true,
    templateUrl: './game-choice-page.component.html',
    styleUrls: ['./game-choice-page.component.scss'],
    imports: [CommonModule, RouterLink],
})
export class GameChoicePageComponent {
    map: Map;
    maps: Map[] = [];
    selectedMap: string | undefined = undefined;
    showErrorMessage: { selectionError: boolean; userError: boolean } = {
        selectionError: false,
        userError: false,
    };

    private readonly router: Router = inject(Router);

    constructor(private communicationMapService: CommunicationMapService) {
        this.communicationMapService.maps$.subscribe((maps) => {
            this.maps = maps;
        });
    }

    ngOnInit(): void {
        this.communicationMapService.getMapsFromServer();
    }

    selectMap(mapId: string | undefined) {
        this.selectedMap = mapId;
    }

    next(mapId: string | undefined) {
        if (this.selectedMap) {
            const chosenMap = this.maps.find((map) => map._id === this.selectedMap);
            if (chosenMap && chosenMap.isVisible) {
                const params = new URLSearchParams();
                params.set('id', this.selectedMap);
                window.location.href = `/create-character/${params}`;
            } else {
                this.showErrorMessage.selectionError = true;
            }
        } else {
            this.showErrorMessage.userError = true;
        }
    }

    onReturn() {
        this.router.navigate(['/mainmenu']);
    }
}
