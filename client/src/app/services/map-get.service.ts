import { Injectable } from '@angular/core';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Map } from '@common/map.types';
import { firstValueFrom } from 'rxjs';
/* eslint-disable no-unused-vars */
@Injectable({
    providedIn: 'root',
})
export class MapGetService {
    map!: Map;

    constructor(private communicationMapService: CommunicationMapService) {}

    async getMap(id: string): Promise<void> {
        this.map = await firstValueFrom(this.communicationMapService.basicGet<Map>(`admin/${id}`));
    }
}
