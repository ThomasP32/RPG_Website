import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
@Injectable({
    providedIn: 'root',
})
export class MapCounterService {
    startingPointCounter: number;

    randomItemCounter: number;

    itemsCounter: number;

    flagCounter: number = 0;

    private startingPointCounterSource = new Subject<number>();
    startingPointCounter$ = this.startingPointCounterSource.asObservable();

    constructor() {}

    updateCounters(item: string | undefined, action: 'add' | 'remove') {
        if (item === 'starting-point') {
            this.updateStartingPointCounter(action === 'add' ? this.startingPointCounter + 1 : this.startingPointCounter - 1);
        }
    }

    updateStartingPointCounter(value: number) {
        this.startingPointCounterSource.next(value);
    }
}
