import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunicationMapService {
    private readonly baseUrl: string = environment.serverUrl;
    constructor(private readonly http: HttpClient) {
        this.http = http;
    }

    basicGet<T>(url: string): Observable<T> {
        return this.http.get<T>(`${this.baseUrl}/${url}`).pipe(catchError(this.handleError<T>('basicGet')));
    }

    basicPost<T>(url: string, data: T): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/${url}`, data, {
            observe: 'response',
            responseType: 'text',
        });
    }

    basicPatch<T>(url: string, data?: T): Observable<HttpResponse<string>> {
        return this.http.patch(`${this.baseUrl}/${url}`, data, {
            observe: 'response',
            responseType: 'text',
        });
    }

    basicPut<T>(url: string, data?: T): Observable<HttpResponse<string>> {
        return this.http.put(`${this.baseUrl}/${url}`, data, {
            observe: 'response',
            responseType: 'text',
        });
    }

    basicDelete(url: string): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/${url}`, {
            observe: 'response',
            responseType: 'text',
        });
    }
    private handleError<T>(request: string, result?: T): () => Observable<T> {
        return () => of(result as T);
    }

    uploadMapFile(url: string, mapData: any): Observable<HttpResponse<any>> {
        return this.basicPost<any>(url, mapData);
    }
}
