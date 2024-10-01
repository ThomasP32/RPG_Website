import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-error-message-component',
    standalone: true,
    imports: [],
    templateUrl: './error-message.component.html',
    styleUrl: './error-message.component.scss',
})
export class ErrorMessageComponent {
    @Input() message: string = '';
    showModal: boolean = false;

    open(message: string) {
        this.message = message;
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }
}
