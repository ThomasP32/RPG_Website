import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { Game } from 'src/app/interfaces/game';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    private readonly baseUrl: string = environment.serverUrl;

    constructor(private readonly http: HttpClient) {}

    // get all visible games
    getVisibleGames(): Observable<Game[]> {
        return this.http.get<Game[]>(`${this.baseUrl}/game`).pipe(catchError(this.handleError<Game[]>('getVisibleGames')));
    }

    // check if a selected game is still available
    checkGameAvailability(id: string): Observable<boolean> {
        return this.http.get<boolean>(`${this.baseUrl}/${id}/visible`).pipe(catchError(this.handleError<boolean>('checkGameAvailability')));
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
