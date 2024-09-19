import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { Map } from 'src/app/interfaces/map';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    private readonly baseUrl: string = environment.serverUrl;

    constructor(private readonly http: HttpClient) {}

    getVisibleGames(): Observable<Map[]> {
        return this.http.get<Map[]>(`${this.baseUrl}`).pipe(catchError(this.handleError<Map[]>('getVisibleGames')));
    }

    checkGameAvailability(id: string): Observable<boolean> {
        return this.http.get<boolean>(`${this.baseUrl}/${id}/isVisible`).pipe(catchError(this.handleError<boolean>('checkGameAvailability')));
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }

    // Mock data for testing
    // private mockGames: Game[] = [
    //     {
    //         name: 'TestGame1',
    //         mapSize: 10,
    //         gameMode: 'classic',
    //         lastModified: '2024-09-15',
    //     },
    //     {
    //         name: 'TestGame2',
    //         mapSize: 15,
    //         gameMode: 'CTF',
    //         lastModified: '2024-09-16',
    //     },
    //     {
    //         name: 'TestGame3',
    //         mapSize: 20,
    //         gameMode: 'classic',
    //         lastModified: '2024-09-17',
    //     },
    //     {
    //         name: 'TestGame4',
    //         mapSize: 10,
    //         gameMode: 'CTF',
    //         lastModified: '2024-09-18',
    //     },
    //     {
    //         name: 'TestGame5',
    //         mapSize: 15,
    //         gameMode: 'classic',
    //         lastModified: '2024-09-19',
    //     },
    // ];

    // getMockVisibleGames(): Observable<Game[]> {
    //     return of(this.mockGames);
    // }

    // checkMockGameAvailability(name: string): Observable<Boolean> {
    //     return of(true);
    // }
}
