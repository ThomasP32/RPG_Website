import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Game } from '@common/game.type';
import { catchError, BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({
    providedIn: 'root',
})
export class CommunicationService {
    games: BehaviorSubject<Game[]> = new BehaviorSubject<Game[]>([]);

    private readonly baseUrl: string = environment.serverUrl;
    
    constructor(private readonly http: HttpClient) {}

    basicGet(): Observable<Game[]> {
        return this.http.get<Game[]>(`${this.baseUrl}/game`).pipe(catchError(this.handleError<Game[]>('basicGet')));
    }

    basicPost(game: Game): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/game`, game, { observe: 'response', responseType: 'text' });
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
