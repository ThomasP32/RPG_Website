import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-map-area',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-area.component.html',
  styleUrl: './map-area.component.scss'
})
export class MapAreaComponent {

  @Input() selectedTile: string = 'grass';
  Map: { value: string | null; isHovered: boolean }[][] = [];
  isPlacing: boolean = false;
  defaultTile = 'grass'; 

  constructor() {
    this.createMap();
  }

  createMap() {
    const numRows = 10;
    const numCols = 10;
    this.Map = [];
  
    for (let i = 0; i < numRows; i++) {
      const row: { value: string | null; isHovered: boolean }[] = [];
      for (let j = 0; j < numCols; j++) {
        row.push({ value: 'grass', isHovered: false });
      }
      this.Map.push(row);
    }
  }

  selectTile(tile: string) {
    this.selectedTile = tile;
    console.log('Selected tile:', tile);
  }

  startPlacingTile(rowIndex: number, colIndex: number) {
    this.isPlacing = true;
    this.placeTile(rowIndex, colIndex);
  }

  stopPlacingTile() {
    this.isPlacing = false;
  }

  placeTileOnMove(rowIndex: number, colIndex: number) {
    if (this.isPlacing) {
      this.placeTile(rowIndex, colIndex);
    }
  }

  placeTile(rowIndex: number, colIndex: number) {
    if (this.selectedTile && this.Map[rowIndex][colIndex].value !== this.selectedTile) {
      this.Map[rowIndex][colIndex].value = this.selectedTile;
    }
  }

  getTileImage(tileValue: string): string {
    switch (tileValue) {
      case 'grass':
        return "../../../../assets/tiles/dustland.png";
      case 'wall':
        return "../../../../assets/tiles/granite cliff.png";
      case 'ice':
        return "../../../../assets/tiles/ice.png";
      case 'water':
        return "../../../../assets/tiles/ocean.png"; 
      default:
        return "../../../../assets/tiles/dustland.png";
    }
   
  }
}
