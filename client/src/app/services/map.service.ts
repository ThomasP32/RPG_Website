import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Map } from '@common/map.types';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    resetMapSource = new Subject<void>();
    resetMap$ = this.resetMapSource.asObservable();

    generateMapSource = new Subject<void>();
    generateMap$ = this.generateMapSource.asObservable();

    updateSelectedTileSource = new BehaviorSubject<string>('');
    updateSelectedTile$ = this.updateSelectedTileSource.asObservable();

    private mapTitleSource = new BehaviorSubject<string>('');
    mapTitle$ = this.mapTitleSource.asObservable();

    private mapDescriptionSource = new BehaviorSubject<string>('');
    mapDescription$ = this.mapDescriptionSource.asObservable();

    constructor(private CommunicationMapService: CommunicationMapService) {}

    setMapTitle(title: string): void {
        this.mapTitleSource.next(title);
    }

    setMapDescription(description: string): void {
        this.mapDescriptionSource.next(description);
    }

    generateMapData() {
        this.generateMapSource.next();
    }

    resetMap() {
        this.resetMapSource.next();
    }

    updateSelectedTile(value: string) {
        this.updateSelectedTileSource.next(value);
    }

    async saveNewMap(map: Map): Promise<string> {
        try {
            console.log('creating map');
            await firstValueFrom(this.CommunicationMapService.basicPost<Map>('admin/creation', map));
        } catch (error) {
            if (error instanceof HttpErrorResponse) {
                let errorMessage = 'Erreur innatendue, veuillez réessayer plus tard...';
                if (error.error) {
                    const errorObj = JSON.parse(error.error);
                    if (typeof errorObj.message === 'string') {
                        errorMessage = errorObj.message;
                    } else {
                        const message: string = errorObj.message.join('');
                        errorMessage = message;
                    }
                }

                return errorMessage;
            } else {
                console.error('Erreur inattendue:', error);
                return 'Erreur inconnue, veuillez réessayer plus tard...';
            }
        }
        return 'Votre jeu a été sauvegardé avec succès!';
    }

    async updateMap(map: Map, mapId: string): Promise<string> {
        try {
            console.log('updating map');
            await firstValueFrom(this.CommunicationMapService.basicPatch<Map>(`admin/edition/${mapId}`, map));
        } catch (error) {
            if (error instanceof HttpErrorResponse) {
                let errorMessage = 'Erreur innatendue, veuillez réessayer plus tard...';
                if (error.error) {
                    const errorObj = JSON.parse(error.error);
                    if (typeof errorObj.message === 'string') {
                        errorMessage = errorObj.message;
                    } else {
                        const message: string = errorObj.message.join('');
                        errorMessage = message;
                    }
                }
                return errorMessage;
            } else {
                console.error('Erreur inattendue:', error);
                return 'Erreur inconnue, veuillez réessayer plus tard...';
            }
        }
        return 'Votre jeu a été sauvegardé avec succès!';
    }
}
