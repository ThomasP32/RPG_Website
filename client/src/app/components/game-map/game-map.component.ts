import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ImageService } from '@app/services/image/image.service';
import { Avatar, Game } from '@common/game';

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
export class GameMapComponent implements OnInit {
    @Input() map: Game;
    Map: { value: string, isHovered: boolean, doorState?: 'open' | 'closed', item?: string, player?: Avatar }[][];

    constructor(private imageService: ImageService) {}

    ngOnInit() {
        this.loadMap(this.map);
    }

    ngOnChanges() {
        this.loadMap(this.map);
    }

    loadMap(map: Game) {
        this.createMap(map.mapSize.x);

        map.tiles.forEach((tile) => {
            this.Map[tile.coordinate.x][tile.coordinate.y].value = tile.category;
        });

        map.doorTiles.forEach((door) => {
            this.Map[door.coordinate.x][door.coordinate.y].value = 'door';
            this.Map[door.coordinate.x][door.coordinate.y].doorState = door.isOpened ? 'open' : 'closed';
        });

        map.startTiles.forEach((start) => {
            this.Map[start.coordinate.x][start.coordinate.y].item = 'starting-point';
        });

        map.items.forEach((item) => {
            this.Map[item.coordinate.x][item.coordinate.y].item = item.category;
        });

        map.players.forEach((player) => {
            console.log('un joueur a la position :', player.position, 'avec avatar :', player.avatar);
            this.Map[player.position.x][player.position.y].player = player.avatar;
        });
    }

    createMap(mapSize: number) {
        this.Map = [];
        for (let i = 0; i < mapSize; i++) {
            const row: { value: string; isHovered: boolean }[] = [];
            for (let j = 0; j < mapSize; j++) {
                row.push({ value: 'floor', isHovered: false });
            }
            this.Map.push(row);
        }
    }

    getTileImage(tileValue: string, rowIndex: number, colIndex: number): string {
        return this.imageService.getTileImage(tileValue, rowIndex, colIndex, this.Map);
    }

    getItemImage(item: string): string {
        return this.imageService.getItemImage(item);
    }

    getAvatarImage(avatar: Avatar): string {
        return this.imageService.getPlayerImage(avatar);
    }

}
