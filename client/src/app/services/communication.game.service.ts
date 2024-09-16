import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Game } from '@common/game.type';
import { catchError, Observable, of, BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({
    providedIn: 'root',
})
export class CommunicationService {
    private games: BehaviorSubject<Game[]> = new BehaviorSubject<Game[]>([]);

    games$ = this.games.asObservable();

    // quand next() est appelé sur games, il faut toujours que les subscribers fassent qqch  

    private readonly baseUrl: string = environment.serverUrl;
    
    constructor(private readonly http: HttpClient) {}

    // fonction qui retourne un observable émettant soit la liste de jeux soit une erreur
    basicGet(): Observable<Game[]> {
        return this.http.get<Game[]>(`${this.baseUrl}/game`).pipe(catchError(this.handleError<Game[]>('basicGet')));
    }

    basicPost(game: Game): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/game`, game, { observe: 'response', responseType: 'text' });
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }

    setGames(updatedGames: Game[]) {
        this.games.next(updatedGames);
        console.log("liste mise à jour");
    }

    // en appelant la fonction tu tabonne a lobservable et tu prends son emission et tu la mets à setGames
    getGamesFromServer(): void {
        this.basicGet().subscribe((games: Game[]) => this.setGames(games))
    }

    // en appelant la fonction tu tabonne a lobservable et si elle retourne une reponse de reussite tu peux ajouter game à games et setGame
    sendGameToServer(game: Game): void {
        // abonnement à basicPost qui prend en parametre un jeu et on attend sa réponse
        this.basicPost(game).subscribe({
            next: () => this.getGamesFromServer(), 
            error: (error) => {
                console.log(error.error);
            }
        });
    }
}
