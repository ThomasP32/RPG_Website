import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [NgClass, CommonModule],
    templateUrl: './toolbar.component.html',
    styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
    @Input() selectedTile: string;

    @Output() tileSelected = new EventEmitter<string>();

    @Output() itemSelected = new EventEmitter<string>();

    mode: string;
    convertedMode: string;

    constructor(private route: ActivatedRoute) {}

    ngOnInit() {
        this.getUrlParams();
        this.urlConverter(this.mode);
        this.createToolbar(this.convertedMode);
    }

    selectTile(tile: string) {
        this.selectedTile = tile;
        this.tileSelected.emit(tile);
        console.log('Selected tile:', this.selectedTile);
    }

    selectItem(item: string) {
        this.itemSelected.emit(item);
    }

    getUrlParams() {
        this.route.queryParams.subscribe((params) => {
            this.mode = this.route.snapshot.params['mode'];
        });
    }
    urlConverter(mode: string) {
        console.log('URL params:', mode);
        this.convertedMode = mode.split('=')[1];
        console.log('Converted mode:', this.convertedMode);
    }
    createToolbar(mode: string) {
        if (mode === 'CTF') {
            // Add the flag item to the item grid
            const itemGrid = document.querySelector('.item-grid');
            if (itemGrid) {
                const flagTile = document.createElement('div');
                flagTile.classList.add('tile');
                flagTile.addEventListener('click', () => this.selectItem('flag'));

                const flagImage = document.createElement('img');
                flagImage.src = '../../../../assets/items/flag.png'; // Assuming you have a flag image
                flagImage.alt = 'flag';

                flagTile.appendChild(flagImage);
                itemGrid.appendChild(flagTile);
            }
        }
    }
}
