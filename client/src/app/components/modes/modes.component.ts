import { Component } from '@angular/core';

@Component({
    selector: 'modes-choice',
    standalone: true,
    imports: [],
    templateUrl: './modes.component.html',
    styleUrl: './modes.component.scss',
})
export class ModesComponent {
    mode: string;

    selectMode(mode: string): void {
        this.mode = mode;
    }
}
