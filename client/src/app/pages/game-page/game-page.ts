import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageService } from '@app/services/image/image.service';
// import { MapService } from '@app/services/map/map.service';
import { Map } from '@common/map.types';
import { GameMapComponent } from '@app/game-map/game-map.component';
/* eslint-disable no-unused-vars */

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [CommonModule, GameMapComponent],
    templateUrl: './game-page.html',
    styleUrl: './game-page.scss',
})
export class GamePageComponent implements OnInit {
    gameMap: Map;
    mapWidth: number;
    mapHeight: number;
    Map: { value: string | null; isHovered: boolean; doorState?: 'open' | 'closed'; item?: string }[][] = [];
    numberOfPlayers: number;
    // activePlayer: Player;
    // player: Player;
    

    constructor(
        // private mapService: MapService,
        private imageService: ImageService,
    ) {}

    ngOnInit() {
        this.loadMap();
        this.loadPlayerInfo();
    }

    loadMap() {
        // this.mapService.getGame().subscribe((mapData: Map) => {
        //     this.gameMap = mapData;
        //     this.mapWidth = mapData.mapSize.x;
        //     this.mapHeight = mapData.mapSize.y;
        //     // this.numberOfPlayers = mapData.numberOfPlayers;
        //     // this.activePlayer = mapData.activePlayer;

        //     this.Map = this.generateMockMap();
        // });
    }

    loadPlayerInfo() {
        // this.player = this.mapService.getPlayer();
    }
    
    getTileImage(tileValue: string, rowIndex: number, colIndex: number): string {
        return this.imageService.getTileImage(tileValue, rowIndex, colIndex, this.Map);
    }

    getItemImage(item: string): string {
        return this.imageService.getItemImage(item);
    }

    generateMockMap() {
        const mockMap = [];
        for (let i = 0; i < this.mapHeight; i++) {
            const row = [];
            for (let j = 0; j < this.mapWidth; j++) {
                const randomTile = Math.random() > 0.5 ? 'grass' : 'water'; 
                const randomItem = Math.random() > 0.8 ? 'sword' : undefined;
                row.push({ value: randomTile, isHovered: false, item: randomItem });
            }
            mockMap.push(row);
        }
        return mockMap;
    }
}
