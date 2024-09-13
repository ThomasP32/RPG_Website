import { Component } from '@angular/core';
import { MapAreaComponent } from '@app/components/map-creation/map-area/map-area.component';
import { ToolbarComponent } from '@app/components/toolbar/toolbar/toolbar.component';

@Component({
  selector: 'app-game-creation-page',
  standalone: true,
  imports: [ToolbarComponent,MapAreaComponent],
  templateUrl: './game-creation-page.component.html',
  styleUrl: './game-creation-page.component.scss'
})
export class GameCreationPageComponent {
  selectedTile: string = 'grass';

  onTileSelected(tile: string) {
    this.selectedTile = tile;
  }
}
