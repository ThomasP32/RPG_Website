import { Injectable } from '@angular/core';
import { Map } from '@common/map.types';
import { BehaviorSubject, Subject } from 'rxjs';
import { CommunicationMapService } from './communication.map.service';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    private resetMapSource = new Subject<void>();
    resetMap$ = this.resetMapSource.asObservable();

    private generateMapSource = new Subject<void>();
    generateMap$ = this.generateMapSource.asObservable();

    private mapTitleSource = new BehaviorSubject<string>('');
    mapTitle$ = this.mapTitleSource.asObservable();

    private mapDescriptionSource = new BehaviorSubject<string>('');
    mapDescription$ = this.mapDescriptionSource.asObservable();

    private startingPointCounterSource = new Subject<number>();
    startingPointCounter$ = this.startingPointCounterSource.asObservable();

    private randomItemCounterSource = new Subject<number>();
    randomItemCounter$ = this.randomItemCounterSource.asObservable();

    private itemsCounterSource = new Subject<number>();
    itemsCounter$ = this.randomItemCounterSource.asObservable();

    constructor(private CommunicationMapService: CommunicationMapService) {}

    setMapTitle(title: string): void {
        this.mapTitleSource.next(title);
    }

    setMapDescription(description: string): void {
        this.mapDescriptionSource.next(description);
    }

    updateStartingPointCounter(value: number) {
        this.startingPointCounterSource.next(value);
    }

    updateRandomItemCounter(value: number) {
        this.randomItemCounterSource.next(value);
    }

    updateItemsCounter(value: number) {
        this.itemsCounterSource.next(value);
    }

    generateMapData() {
        this.generateMapSource.next();
    }

    resetMap() {
        console.log('MapService: Triggering map reset');
        this.resetMapSource.next();
    }

    saveNewMap(map: Map) {
        console.log('MapService: Triggering map saving');
        try {
            this.CommunicationMapService.basicPost('admin/creation', map).subscribe((error) => {
                console.log(error, 'La map a été save');
            });
        } catch (error) {
            console.error('Error while saving map:', error);
        }
    }

    saveEditedMap(map: Map) {
        console.log('MapService: Triggering map saving');
        try {
            this.CommunicationMapService.basicPatch('admin/edition', map).subscribe((error) => {
                console.log(error, 'La map a été modifiée & save');
            });
        } catch (error) {
            console.error('Error while saving map:', error);
        }
    }
}
