import { Injectable } from '@angular/core';
import { Map } from '@common/map.types';
import { BehaviorSubject, Subject } from 'rxjs';
import { CommunicationMapService } from './communication.map.service';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    resetMapSource = new Subject<void>();
    resetMap$ = this.resetMapSource.asObservable();

    generateMapSource = new Subject<void>();
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
        this.resetMapSource.next();
    }

    saveNewMap(map: Map) {
        this.CommunicationMapService.basicPost('admin/creation', map).subscribe({
            next: () => {
                // Handle success (e.g., display a success message to the user)
                // ... your logic to handle success (e.g., show a notification, update the UI) ...
            },
            error: (error) => {
                // Handle the error (e.g., display an error message to the user)
                // ... your logic to handle the error (e.g., show an error notification, log the error to a service) ...
            },
        });
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
