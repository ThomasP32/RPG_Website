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

    private randomItemCounterSource = new Subject<number>();
    randomItemCounter$ = this.randomItemCounterSource.asObservable();

    private itemsCounterSource = new Subject<number>();
    itemsCounter$ = this.randomItemCounterSource.asObservable();

    constructor() {}

    updateCounters(item: string | undefined, action: 'add' | 'remove') {
        if (item === 'starting-point') {
            this.updateStartingPointCounter(action === 'add' ? this.startingPointCounter + 1 : this.startingPointCounter - 1);
        } else if (item === 'random') {
            this.updateRandomItemCounter(action === 'add' ? this.randomItemCounter + 1 : this.randomItemCounter - 1);
        } else if (item) {
            this.updateItemsCounter(action === 'add' ? this.itemsCounter + 1 : this.itemsCounter - 1);
        }
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
}
