import { NgClass } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-modes-choice',
    standalone: true,
    imports: [NgClass],
    templateUrl: './modes.component.html',
    styleUrl: './modes.component.scss',
})
export class ModesComponent {
    @Output() selectedMode: string;
    @Output() modeSelected = new EventEmitter<string>();

    selectMode(mode: string): void {
        this.selectedMode = mode;
        this.modeSelected.emit(mode);
    }
}
