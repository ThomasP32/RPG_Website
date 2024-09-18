import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommunicationService } from '@app/services/communication.map.service';
import { ItemCategory, Map, TileCategory } from '@common/map.types';

@Component({
    selector: 'app-main-page',
    standalone: true,
    templateUrl: './main-page-map.component.html',
    styleUrls: ['./main-page.component.scss'],
    imports: [RouterLink],
})
export class MainPageComponent {
    mapPrototype: Map = {
        name: "Enum version",
        isVisible: false,
        mapSize: {
          x: 10,
          y: 10
        },
        startTiles: [
          {
            coordinate: {
              x: 5,
              y: 1
            }
          }
        ],
        items: [
          {
            coordinate: {
              x: 1,
              y: 3
            },
            category: ItemCategory.Sword
          }
        ],
        doorTiles: [
          {
            coordinate: {
              x: 1,
              y: 2
            },
            isOpened: true
          }
        ],
        tiles: [
          {
            coordinate: {
              x: 3,
              y: 4
            },
            category: TileCategory.Wall
          },
          {
            coordinate: {
              x: 7,
              y: 2
            },
            category: TileCategory.Water
          }
        ]
      };

    constructor(readonly communicationService: CommunicationService) {}
}
