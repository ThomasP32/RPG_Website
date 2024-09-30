import { HttpResponse } from '@angular/common/http';
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
            const response: HttpResponse<string> = await firstValueFrom(this.CommunicationMapService.basicPost('admin/creation', map));
            return response.body as string;
        } catch (error: any) {
            console.error('Error during map creation:', error);
            throw new Error(error.message || 'Une erreur est survenue lors de la création de la carte.');
        }
    }

    saveEditedMap(map: Map) {
        this.CommunicationMapService.basicPatch('admin/edition', map).subscribe({
            next: () => {
                // Handle success (e.g., display a success message)
                // ... your logic to handle success ...
            },
            error: (error) => {
                // Handle error (e.g., display an error message)
                // ... your logic to handle error ...
            },
        });
    }
}
