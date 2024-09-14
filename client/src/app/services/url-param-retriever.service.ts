import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, Observable } from 'rxjs';

export interface UrlParams {
    mapSize: string;
    mode: string;
}
@Injectable({
    providedIn: 'root',
})
export class UrlParamRetrieverService {
    private urlParams: UrlParams = { mapSize: '', mode: '' };

    constructor(private route: ActivatedRoute) {}

    getMapSize(): Observable<string> {
        return this.route.queryParams.pipe(
            map((params) => {
                this.urlParams.mapSize = params['size'];
                return this.urlParams.mapSize;
            }),
        );
    }

    // getMapSize(): string {
    //     this.route.queryParams.subscribe((params) => {
    //         this.urlParams.mapSize = this.route.snapshot.params['size'];
    //     });
    //     return this.urlParams.mapSize;
    // }

    getMode(): string {
        this.route.queryParams.subscribe((params) => {
            this.urlParams.mode = this.route.snapshot.params['mode'];
        });
        return this.urlParams.mode;
    }
}

// getUrlParams() {
//     this.route.queryParams.subscribe((params) => {
//         this.mapSize = this.route.snapshot.params['size'];
//         this.mode = this.route.snapshot.params['mode'];
//         console.log('Retrieved URL params:', { mapSize: this.mapSize, mode: this.mode });
//     });
// }
