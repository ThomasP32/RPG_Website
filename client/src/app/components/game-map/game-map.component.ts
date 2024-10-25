import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/* eslint-disable no-unused-vars */
/* Les variables sont nécessaires pour afficher correctement le contenu dans le template. Elles sont utilisées dans des 
fonctions comme getTileImage() et getItemImage() pour rendre la carte du jeu et les objets correctement.

Le linter ne reconnaît pas l'utilisation dans le template et ne comprend pas que ces variables sont utilisées dans 
le HTML et non directement dans le code TypeScript. En désactivant cette règle pour ces lignes, nous disons 
à ESLint d'ignorer l'erreur, car nous savons que ces variables sont bien utilisées. */

@Component({
    selector: 'app-game-map',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-map.component.html',
    styleUrl: './game-map.component.scss',
})
export class GameMapComponent {
    @Input() map: { value: string | null; isHovered: boolean; doorState?: 'open' | 'closed'; item?: string }[][];
    @Input() getTileImage: (tileValue: string, rowIndex: number, colIndex: number) => string;
    @Input() getItemImage: (item: string) => string;

    constructor() {}
}
