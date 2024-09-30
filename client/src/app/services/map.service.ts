// import { Injectable } from '@angular/core';
// import { Map } from '@common/map.types';
// import { BehaviorSubject, Subject } from 'rxjs';
// import { CommunicationMapService } from './communication.map.service';

// @Injectable({
//     providedIn: 'root',
// })
// export class MapService {
//     private resetMapSource = new Subject<void>();
//     private generateMapSource = new Subject<void>();

//     resetMap$ = this.resetMapSource.asObservable();
//     generateMap$ = this.generateMapSource.asObservable();

//     constructor(private CommunicationMapService: CommunicationMapService) {}

//     private startingPointCounterSource = new BehaviorSubject<number>(10);
//     startingPointCounter$ = this.startingPointCounterSource.asObservable();

//     updateStartingPointCounter(value: number) {
//         this.startingPointCounterSource.next(value);
//     }

//     generateMapData() {
//         this.generateMapSource.next();
//     }

//     resetMap() {
//         console.log('MapService: Triggering map reset');
//         this.resetMapSource.next();
//     }

//     saveMap(mapData: Map): void {
//         try {
//             // const mapData = this.generateMapData();
//             this.CommunicationMapService.sendMapToServer(mapData);
//             console.log('Map saved', mapData);
//         } catch (error) {
//             console.error('Error while saving map:', error);
//         }
//     }
// }
