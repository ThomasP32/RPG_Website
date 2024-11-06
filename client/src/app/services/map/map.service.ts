import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Cell } from '@common/map-cell';
import { DetailedMap, ItemCategory, Map, Mode, TileCategory } from '@common/map.types';
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

    removeStartingPointSource = new Subject<boolean>();
    removeStartingPoint$ = this.removeStartingPointSource.asObservable();

    constructor(
        private communicationMapService: CommunicationMapService,
        private router: Router,
    ) {
        this.communicationMapService = communicationMapService;
        this.router = router;
    }

    async getMap(id: string): Promise<void> {
        try {
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

    generateMapFromEdition(map: Cell[][]): void {
        this.map.doorTiles = [];
        this.map.tiles = [];
        this.map.items = [];
        this.map.startTiles = [];

        for (let rowIndex = 0; rowIndex < map.length; rowIndex++) {
            for (let colIndex = 0; colIndex < map[rowIndex].length; colIndex++) {
                const cell = map[rowIndex][colIndex];
                const coordinate = { x: rowIndex, y: colIndex };

                if (cell && cell.tileType) {
                    if (cell.door?.isDoor) {
                        this.map.doorTiles.push({
                            coordinate,
                            isOpened: cell.door.isOpen === true,
                        });
                    } else if (['water', 'ice', 'wall'].includes(cell.tileType)) {
                        this.map.tiles.push({
                            coordinate,
                            category: cell.tileType as TileCategory,
                        });
                    }

                    if (cell.item && cell.item != undefined && cell.isStartingPoint) {
                        this.map.items.push({
                            coordinate,
                            category: cell.item as ItemCategory,
                        });
                    }

                    if (cell.isStartingPoint) {
                        this.map.startTiles.push({
                            coordinate,
                        });
                    }
                }
            }
        }
    }

    resetMap() {
        this.resetMapSource.next();
    }

    updateSelectedTile(value: string) {
        this.updateSelectedTileSource.next(value);
    }

    removeStartingPoint(isStartingPoint: boolean) {
        this.removeStartingPointSource.next(isStartingPoint);
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
