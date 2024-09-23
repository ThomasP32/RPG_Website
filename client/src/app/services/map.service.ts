import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  private resetMapSource = new Subject<void>();
  private generateMapSource = new Subject<void>();

  resetMap$ = this.resetMapSource.asObservable();
  generateMap$ = this.resetMapSource.asObservable();

  // constructor(private http: HttpClient) {}

  private startingPointCounterSource = new BehaviorSubject<number>(10);
  startingPointCounter$ = this.startingPointCounterSource.asObservable();

  updateStartingPointCounter(value: number) {
    this.startingPointCounterSource.next(value);
  }

  generateMapData(){
    this.generateMapSource.next();
  }

  resetMap() {
    console.log('MapService: Triggering map reset');
    this.resetMapSource.next();
  }

  saveMap(mapData: any) {
    console.log('MapService: Triggering map saving');
    // return this.http.post('/api/save-map', mapData);
  }
}
