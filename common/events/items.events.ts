import { Game, Player } from '@common/game';
import { ItemCategory } from '@common/map.types';

export enum ItemsEvents {
    dropItem = 'dropItem',

    InventoryFull = 'inventoryFull',
    ItemDropped = 'itemDropped',
}

export interface DropItemData {
    itemDropping: ItemCategory;
    gameId: string;
}

export interface ItemDroppedData {
    updatedGame: Game;
    updatedPlayer: Player;
}
