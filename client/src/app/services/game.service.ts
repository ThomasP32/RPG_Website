import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Game } from 'src/app/interfaces/vec2';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    private readonly baseUrl: string = environment.serverUrl; // changer pour URL aux jeux

    constructor(private readonly http: HttpClient) {}

    // get all visible games
    getVisibleGames(): Observable<Game[]> {
        return this.http.get<Game[]>(`${this.baseUrl}/visible`); // .pipe(catchError(this.handleError<Games[]>('getVisibleGames', [])));
    }

    // check if a selected game is still available
    checkGameAvailability(id: number): Observable<boolean> {
        return this.http.get<boolean>(`${this.baseUrl}/${id}/available`); // .pipe(catchError(this.handleError<boolean>('checkGameAvailability', false)));
    }
}
