import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Map } from '@common/map.types';
import { BehaviorSubject, catchError, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunicationMapService {
    private readonly baseUrl: string = environment.serverUrl;

    private maps: BehaviorSubject<Map[]> = new BehaviorSubject<Map[]>([]);

    maps$ = this.maps.asObservable();

    constructor(private readonly http: HttpClient) {}

    // fonction qui retourne un observable émettant soit la liste de jeux soit une erreur (emettre cest .next())
    basicGet(): Observable<Map[]> {
        return this.http.get<Map[]>(`${this.baseUrl}/map`).pipe(catchError(this.handleError<Map[]>('basicGet')));
    }

    // http.post renvoie un observable qui emettra la reponse du post quand elle sera recue
    basicPost(map: Map): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/map`, map, { observe: 'response', responseType: 'text' });
    }

    // // fonction qui retourne un observable émettant soit la liste de jeux soit une erreur (emettre cest .next())
    // basicGet<T>(url: string): Observable<T> {
    //     return this.http.get<T>(`${this.baseUrl}/${url}`).pipe(catchError(this.handleError<T>('basicGet')));
    // }

    // // http.post renvoie un observable qui emettra la reponse du post quand elle sera recue
    // basicPost<T>(url: string, data: T): Observable<HttpResponse<string>> {
    //     return this.http.post(`${this.baseUrl}/${url}`, data, {
    //         observe: 'response',
    //         responseType: 'text',
    //     });
    // }

    // basicPatch<T>(url: string, data?: T): Observable<HttpResponse<Object>> {
    //     return this.http.patch(`${this.baseUrl}/${url}`, data, {
    //         observe: 'response',
    //         responseType: 'text',
    //     });
    // }

    basicDelete(url: string): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/${url}`, {
            observe: 'response',
            responseType: 'text', // Le type de réponse est défini comme "text"
        });
    }

    setMaps(updatedMaps: Map[]) {
        this.maps.next(updatedMaps);
        console.log('liste mise à jour');
    }

    // en appelant la fonction tu tabonne a lobservable et tu prends son emission et tu la mets à setMaps
    getMapsFromServer(): void {
        this.basicGet().subscribe((maps: Map[]) => this.setMaps(maps));
    }

    // en appelant la fonction tu tabonne a lobservable et si elle retourne une reponse de reussite tu peux ajouter map à maps et setMap
    sendMapToServer(map: Map): void {
        // abonnement à basicPost qui prend en parametre un jeu et on attend sa réponse
        this.basicPost(map).subscribe({
            next: () => this.getMapsFromServer(),
            error: (error) => {
                console.log(error.error);
            },
        });
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
