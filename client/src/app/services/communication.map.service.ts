import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Map } from '@common/map.types';
import { catchError, Observable, of, BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({
    providedIn: 'root',
})
export class CommunicationService {
    private maps: BehaviorSubject<Map[]> = new BehaviorSubject<Map[]>([]);

    maps$ = this.maps.asObservable();

    // quand next() est appelé sur maps, il faut toujours que les subscribers fassent qqch  

    private readonly baseUrl: string = environment.serverUrl;
    
    constructor(private readonly http: HttpClient) {}

    // fonction qui retourne un observable émettant soit la liste de jeux soit une erreur
    basicGet(): Observable<Map[]> {
        return this.http.get<Map[]>(`${this.baseUrl}/map`).pipe(catchError(this.handleError<Map[]>('basicGet')));
    }

    basicPost(map: Map): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/map`, map, { observe: 'response', responseType: 'text' });
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }

    setMaps(updatedMaps: Map[]) {
        this.maps.next(updatedMaps);
        console.log("liste mise à jour");
    }

    // en appelant la fonction tu tabonne a lobservable et tu prends son emission et tu la mets à setMaps
    getMapsFromServer(): void {
        this.basicGet().subscribe((maps: Map[]) => this.setMaps(maps))
    }

    // en appelant la fonction tu tabonne a lobservable et si elle retourne une reponse de reussite tu peux ajouter map à maps et setMap
    sendMapToServer(map: Map): void {
        // abonnement à basicPost qui prend en parametre un jeu et on attend sa réponse
        this.basicPost(map).subscribe({
            next: () => this.getMapsFromServer(), 
            error: (error) => {
                console.log(error.error);
            }
        });
    }
}
