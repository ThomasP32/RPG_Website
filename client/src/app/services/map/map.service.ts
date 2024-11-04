import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { DetailedMap, Map, Mode } from '@common/map.types';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    map!: Map;

    selectedTile: string;

    resetMapSource = new Subject<void>();
    resetMap$ = this.resetMapSource.asObservable();

    generateMapSource = new Subject<void>();
    generateMap$ = this.generateMapSource.asObservable();

    updateSelectedTileSource = new BehaviorSubject<string>('');
    updateSelectedTile$ = this.updateSelectedTileSource.asObservable();

    constructor(
        private communicationMapService: CommunicationMapService,
        private router: Router,
    ) {
        this.communicationMapService = communicationMapService;
        this.router = router;
    }

    async getMap(id: string): Promise<void> {
        try {
            // Disabling no-unused-vars here because _id, isVisible, and lastModified are intentionally extracted 
            // to exclude them from restOfMap, even though they’re not used directly.
            // eslint-disable-next-line no-unused-vars
            const { _id, isVisible, lastModified, ...restOfMap } = await firstValueFrom(
                this.communicationMapService.basicGet<DetailedMap>(`admin/${id}`),
            );
            this.map = { ...restOfMap };
        } catch (error) {
            this.router.navigate(['/']);
        }
    }

    createMap(mode: Mode, size: number): void {
        this.map = {
            name: '',
            description: '',
            imagePreview: '',
            mode: mode,
            mapSize: { x: size, y: size },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
        };
    }

    generateMap() {
        this.generateMapSource.next();
    }

    resetMap() {
        this.resetMapSource.next();
    }

    updateSelectedTile(value: string) {
        this.updateSelectedTileSource.next(value);
    }

    async saveNewMap(): Promise<string> {
        try {
            await firstValueFrom(this.communicationMapService.basicPost<Map>('admin/creation', this.map));
        } catch (error) {
            if (error instanceof HttpErrorResponse) {
                let errorMessage = 'Erreur inattendue, veuillez réessayer plus tard...';
                if (error.error) {
                    try {
                        const errorObj = JSON.parse(error.error);
                        if (typeof errorObj.message === 'string') {
                            errorMessage = errorObj.message;
                        } else {
                            const message: string = errorObj.message.join(' ');
                            errorMessage = message;
                        }
                    } catch (e) {
                        return errorMessage;
                    }
                }
                return errorMessage;
            } else {
                return 'Erreur inconnue, veuillez réessayer plus tard...';
            }
        }
        return 'Votre jeu a été sauvegardé avec succès!';
    }

    async updateMap(mapId: string): Promise<string> {
        try {
            await firstValueFrom(this.communicationMapService.basicPut<Map>(`admin/edition/${mapId}`, this.map));
        } catch (error) {
            if (error instanceof HttpErrorResponse) {
                let errorMessage = 'Erreur inattendue, veuillez réessayer plus tard...';
                if (error.error) {
                    try {
                        const errorObj = JSON.parse(error.error);
                        if (typeof errorObj.message === 'string') {
                            errorMessage = errorObj.message;
                        } else {
                            const message: string = errorObj.message.join(' ');
                            errorMessage = message;
                        }
                    } catch (e) {
                        return errorMessage;
                    }
                }
                return errorMessage;
            } else {
                return 'Erreur inconnue, veuillez réessayer plus tard...';
            }
        }
        return 'Votre jeu a été sauvegardé avec succès!';
    }
}
