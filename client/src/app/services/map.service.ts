import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Map, Mode } from '@common/map.types';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';
/* eslint-disable no-unused-vars */
@Injectable({
    providedIn: 'root',
})
export class MapService {
    map!: Map;

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

    constructor(private communicationMapService: CommunicationMapService) {}

    async getMap(id: string): Promise<void> {
        this.map = await firstValueFrom(this.communicationMapService.basicGet<Map>(`admin/${id}`));
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

    generateMapData() {
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
            console.log(this.map);
            await firstValueFrom(this.communicationMapService.basicPost<Map>('admin/creation', this.map));
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

    async updateMap(mapId: string): Promise<string> {
        try {
            console.log(this.map);
            const cleanedMap = this.cleanMapForSave(this.map);
            await firstValueFrom(this.communicationMapService.basicPatch<Map>(`admin/edition/${mapId}`, cleanedMap));
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

    cleanMapForSave(map: any): Map {
        const { _id, isVisible, lastModified, __v, ...cleanedMap } = map;
        return cleanedMap;
    }
}
