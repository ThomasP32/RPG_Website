import { Injectable } from '@angular/core';
import { Cell } from '@common/map-cell';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameDataService {
    constructor() {}
    private surroundingMapSource = new BehaviorSubject<Cell[][]>([]);
    surroundingMap$ = this.surroundingMapSource.asObservable();

    setSurroundingMap(map: Cell[][]) {
        this.surroundingMapSource.next(map);
    }
}
