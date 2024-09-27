import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunicationMapService {
    private readonly baseUrl: string = environment.serverUrl;

    constructor(private readonly http: HttpClient) {}

    // fonction qui retourne un observable émettant soit la liste de jeux soit une erreur (emettre cest .next())
    basicGet<T>(url: string): Observable<T> {
        return this.http.get<T>(`${this.baseUrl}/${url}`).pipe(catchError(this.handleError<T>('basicGet')));
    }

    // http.post renvoie un observable qui emettra la reponse du post quand elle sera recue
    basicPost(map: Map): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/map`, map, { observe: 'response', responseType: 'text' });
    // basicPost<T>(url: string, data: T): Observable<HttpResponse<string>> {
    //     return this.http.post(`${this.baseUrl}/${url}`, data, {
    //         observe: 'response',
    //         responseType: 'text',
    //     });
    }

    basicPatch<T>(url: string, data?: T): Observable<HttpResponse<Object>> {
        return this.http.patch(`${this.baseUrl}/${url}`, data, {
            observe: 'response',
            responseType: 'text',
        });
    }

    basicDelete(url: string): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/${url}`, {
            observe: 'response',
            responseType: 'text',  // Le type de réponse est défini comme "text"
        });
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
