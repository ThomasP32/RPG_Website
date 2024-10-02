/* eslint-disable */
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

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

    getMapSize(): string {
        this.route.queryParams.subscribe((params) => {
            this.urlParams.mapSize = this.route.snapshot.params['size'];
        });
        return this.urlParams.mapSize;
    }

    getMode(): string {
        this.route.queryParams.subscribe((params) => {
            this.urlParams.mode = this.route.snapshot.params['mode'];
        });
        return this.urlParams.mode;
    }
}
