import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Game } from '@common/game.type'; // Assure-toi d'importer ton type Game

@Injectable({
  providedIn: 'root', // Fournit le service à toute l'application
})
export class GameService {
  // Comportement réactif qui contient la liste des jeux
  games: BehaviorSubject<Array<Game>> = new BehaviorSubject<Array<Game>>([]);
  
}
