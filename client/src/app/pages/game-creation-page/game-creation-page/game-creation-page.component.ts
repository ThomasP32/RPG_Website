import { Component } from '@angular/core';
import { MapAreaComponent } from '@app/components/map-area/map-area.component';
import { MapControlBarComponent } from '@app/components/map-control-bar/map-control-bar.component';
import { ToolbarComponent } from '@app/components/toolbar/toolbar.component';

@Component({
  selector: 'app-game-creation-page',
  standalone: true,
  imports: [MapControlBarComponent,ToolbarComponent,MapAreaComponent],
  templateUrl: './game-creation-page.component.html',
  styleUrl: './game-creation-page.component.scss'
})
export class GameCreationPageComponent {
  selectedTile: string = 'grass';

  onTileSelected(tile: string) {
    this.selectedTile = tile;
  }
}
