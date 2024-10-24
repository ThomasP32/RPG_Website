import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

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
