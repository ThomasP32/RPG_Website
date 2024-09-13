import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [NgClass,CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  @Input() selectedTile: string;

  @Output() tileSelected = new EventEmitter<string>();

  @Output() itemSelected = new EventEmitter<string>();

  selectTile(tile: string) {
    this.selectedTile = tile;
    this.tileSelected.emit(tile);
    console.log('Selected tile:', this.selectedTile,);
  }

  selectItem(item: string) {
    this.itemSelected.emit(item);
  }

  
}
