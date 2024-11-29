import { Component, Input } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { ImageService } from '@app/services/image/image.service';
import { DropItemData, ItemsEvents } from '@common/events/items.events';
import { Player } from '@common/game';
import { ItemCategory } from '@common/map.types';

@Component({
    selector: 'app-inventory-modal',
    standalone: true,
    imports: [],
    templateUrl: './inventory-modal.component.html',
    styleUrl: './inventory-modal.component.scss',
})
export class InventoryModalComponent {
    @Input() player: Player;
    @Input() gameId: string;
    constructor(
        protected imageService: ImageService,
        protected socketService: SocketService,
    ) {
        this.imageService = imageService;
        this.socketService = socketService;
    }

    dropItem(item: ItemCategory) {
        const dropItemData: DropItemData = { itemDropping: item, gameId: this.gameId };
        this.socketService.sendMessage(ItemsEvents.dropItem, dropItemData);
    }
}
