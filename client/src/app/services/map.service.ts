import { Injectable } from '@angular/core';
import { Map } from '@common/map.types';
import { BehaviorSubject, Subject } from 'rxjs';
import { CommunicationMapService } from './communication.map.service';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    private resetMapSource = new Subject<void>();
    private generateMapSource = new Subject<void>();

    private mapTitleSource = new BehaviorSubject<string>('');
    private mapDescriptionSource = new BehaviorSubject<string>('');

    private startingPointCounterSource = new Subject<number>();
    private randomItemtCounterSource = new Subject<number>();
    private itemsCounterSource = new Subject<number>();

    resetMap$ = this.resetMapSource.asObservable();
    generateMap$ = this.generateMapSource.asObservable();
    mapTitle$ = this.mapTitleSource.asObservable();
    mapDescription$ = this.mapDescriptionSource.asObservable();
    startingPointCounter$ = this.startingPointCounterSource.asObservable();
    randomItemCounter$ = this.randomItemtCounterSource.asObservable();
    itemsCounter$ = this.randomItemtCounterSource.asObservable();

    constructor(private CommunicationMapService: CommunicationMapService) {}

    setMapTitle(title: string): void {
        console.log(title);
        this.mapTitleSource.next(title);
    }

    setMapDescription(description: string): void {
        this.mapDescriptionSource.next(description);
    }

    updateStartingPointCounter(value: number) {
        this.startingPointCounterSource.next(value);
    }

    updateRandomItemCounter(value: number) {
        this.randomItemtCounterSource.next(value);
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

    saveMap(map: Map) {
        console.log('MapService: Triggering map saving');
        try {
            this.CommunicationMapService.basicPost('admin/creation', map).subscribe((error) => {
                console.log(error, 'La map a été save');
            });
        } catch (error) {
            console.error('Error while saving map:', error);
        }
    }
}
