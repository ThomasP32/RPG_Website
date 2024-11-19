import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-inventory-modal',
    standalone: true,
    imports: [],
    templateUrl: './inventory-modal.component.html',
    styleUrl: './inventory-modal.component.scss',
})
export class InventoryModalComponent implements OnInit, OnDestroy {
    @Input() player: { name: string } = { name: '' };
    @Input() gameId: string;
    messageSubscription: Subscription;

    ngOnInit(): void {
      
    }

    ngOnDestroy(): void {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
    }
}
