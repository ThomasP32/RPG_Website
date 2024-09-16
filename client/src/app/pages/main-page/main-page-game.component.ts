import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommunicationService } from '@app/services/communication.game.service';
import { Game } from '@common/game.type';

@Component({
    selector: 'app-main-page',
    standalone: true,
    templateUrl: './main-page-game.component.html',
    styleUrls: ['./main-page.component.scss'],
    imports: [RouterLink],
})
export class MainPageComponent {
    gamePrototype: Game = {
        name: 'pat',
        isVisible: true,
        mapSize: { x: 20, y: 20 }, // Taille de la carte
        startTiles: [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
        ], // Coordonnées de départ

        // Attributs d'items du jeu
        attributeItem1: { x: 3, y: 5 },
        attributeItem2: { x: 6, y: 9 },

        // Conditions liées aux items
        conditionItem1: { x: 7, y: 7 },
        conditionItem2: { x: 8, y: 8 },

        // Fonctions liées aux items
        functionItem1: { x: 9, y: 10 },
        functionItem2: { x: 4, y: 2 },

        // Tiles d'eau
        waterTiles: [
            { x: 15, y: 15 },
            { x: 16, y: 16 },
        ],

        // Tiles de glace
        iceTiles: [
            { x: 12, y: 13 },
            { x: 14, y: 14 },
        ],

        // Tiles de murs
        wallTiles: [
            { x: 18, y: 19 },
            { x: 10, y: 11 },
        ],

        // Portes avec coordonnées et statut d'ouverture/fermeture
        doorTiles: [
            { coordinate: { x: 5, y: 5 }, isOpened: false },
            { coordinate: { x: 6, y: 6 }, isOpened: true },
        ],
    };

    constructor(readonly communicationService: CommunicationService) {}
}
