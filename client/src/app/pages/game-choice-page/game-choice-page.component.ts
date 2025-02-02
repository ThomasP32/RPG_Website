import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { MapConversionService } from '@app/services/map-conversion/map-conversion.service';
import { TIME_LIMIT_DELAY } from '@common/constants';
import { Map } from '@common/map.types';
import { firstValueFrom } from 'rxjs';
@Component({
    selector: 'app-game-choice-page',
    standalone: true,
    templateUrl: './game-choice-page.component.html',
    styleUrls: ['./game-choice-page.component.scss'],
    imports: [CommonModule, RouterLink],
})
export class GameChoicePageComponent implements OnInit {
    map: Map;
    maps: Map[] = [];
    selectedMap: string | undefined = undefined;
    showErrorMessage: { userError: boolean; gameChoiceError: boolean } = {
        userError: false,
        gameChoiceError: false,
    };

    private readonly router: Router = inject(Router);

    constructor(
        private readonly communicationMapService: CommunicationMapService,
        private readonly mapConversionService: MapConversionService,
    ) {
        this.communicationMapService = communicationMapService;
        this.mapConversionService = mapConversionService;
    }

    async ngOnInit(): Promise<void> {
        this.maps = await firstValueFrom(this.communicationMapService.basicGet<Map[]>('map'));
    }

    selectMap(mapName: string) {
        this.selectedMap = mapName;
    }

    getMapPlayers(mapSize: number): string {
        return this.mapConversionService.getPlayerCountMessage(mapSize);
    }

    async next() {
        if (this.selectedMap) {
            const chosenMap = await firstValueFrom(this.communicationMapService.basicGet<Map>(`map/${this.selectedMap}`));
            if (!chosenMap) {
                this.showErrorMessage.gameChoiceError = true;
                setTimeout(() => {
                    this.router.navigate(['/']);
                }, TIME_LIMIT_DELAY);
            } else {
                this.router.navigate([`create-game/${this.selectedMap}/create-character`]);
            }
        } else {
            this.showErrorMessage.userError = true;
        }
    }

    onReturn() {
        this.router.navigate(['/']);
    }
}
