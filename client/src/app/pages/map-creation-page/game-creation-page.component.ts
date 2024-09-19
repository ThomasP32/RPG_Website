import { Component, OnInit, ViewChild } from '@angular/core';
import { MapAreaComponent } from '@app/components/map-area/map-area.component';
import { MapControlBarComponent } from '@app/components/map-control-bar/map-control-bar.component';
import { ToolbarComponent } from '@app/components/toolbar/toolbar.component';
import { MapService } from '@app/services/map.service';

@Component({
  selector: 'app-game-creation-page',
  standalone: true,
  imports: [MapControlBarComponent,ToolbarComponent,MapAreaComponent],
  templateUrl: './game-creation-page.component.html',
  styleUrl: './game-creation-page.component.scss'
})
export class GameCreationPageComponent implements OnInit{
  selectedTile: string = 'grass';

  @ViewChild(MapAreaComponent, { static: false }) mapAreaComponent!: MapAreaComponent;

  constructor(private mapService: MapService) {}

  ngOnInit(): void {
    // Subscribe to resetMap$ observable from the service
    this.mapService.resetMap$.subscribe(() => {
      if (this.mapAreaComponent) {
        console.log('GameCreationPage: Resetting map via service');
        this.mapAreaComponent.resetMapToDefault();
      }
    });
  }

  onTileSelected(tile: string) {
    this.selectedTile = tile;
  }
}
