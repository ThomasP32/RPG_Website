import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  // BehaviorSubject to hold and emit map reset events
  private resetMapSource = new Subject<void>();

  // Observable to subscribe to the reset event
  resetMap$ = this.resetMapSource.asObservable();

  constructor() {}

  // Method to trigger map reset
  resetMap() {
    console.log('MapService: Triggering map reset');
    this.resetMapSource.next();
  }
}
