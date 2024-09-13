import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'modes-choice',
    standalone: true,
    imports: [],
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
