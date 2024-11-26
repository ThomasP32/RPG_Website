import { Player } from '@common/game';
import { Coordinate, ItemCategory } from '@common/map.types';
import { Inject, Injectable } from '@nestjs/common';
import { GameCreationService } from '../game-creation/game-creation.service';
import { GameManagerService } from '../game-manager/game-manager.service';

@Injectable()
export class ItemsManagerService {
    @Inject(GameCreationService) private gameCreationService: GameCreationService;
    @Inject(GameManagerService) private gameManagerService: GameManagerService;

    dropInventory(player: Player, gameId: string): void {
        const game = this.gameCreationService.getGameById(gameId);
        if (!game) return;
        const availableTile = this.gameManagerService.getFirstFreePosition(player.position, game);
        this.dropItem(player.inventory[0], gameId, player, player.position);
        for (let item of player.inventory) {
            this.dropItem(item, gameId, player, availableTile);
        }
    }

    pickUpItem(pos: Coordinate, gameId: string, player: Player): void {
        const game = this.gameCreationService.getGameById(gameId);
        const itemIndex = game.items.findIndex((item) => item.coordinate.x === pos.x && item.coordinate.y === pos.y);
        if (itemIndex !== -1) {
            const item = game.items[itemIndex].category;
            player.inventory.push(item);
            game.items.splice(itemIndex, 1);
            if (item === ItemCategory.Sword || item === ItemCategory.Armor) this.activateItem(item, player);
        }
    }

    dropItem(itemDropping: ItemCategory, gameId: string, player: Player, coordinates: Coordinate): void {
        const game = this.gameCreationService.getGameById(gameId);
        const itemIndex = player.inventory.findIndex((item) => item === itemDropping);
        if (itemIndex !== -1) {
            const item = player.inventory[itemIndex];
            player.inventory.splice(itemIndex, 1);
            game.items.push({ coordinate: coordinates, category: item });
            this.desactivateItem(item, player);
        }
    }

    activateItem(item: ItemCategory, player: Player): void {
        switch (item) {
            case ItemCategory.Sword:
                player.specs.speed += 2;
                player.specs.attack += 4;
                break;
            case ItemCategory.Armor:
                player.specs.defense += 5;
                player.specs.speed -= 1;
                break;
            case ItemCategory.Flask:
                player.specs.attack += 4;
                break;
        }
    }

    desactivateItem(item: ItemCategory, player: Player): void {
        switch (item) {
            case ItemCategory.Sword:
                player.specs.speed -= 2;
                player.specs.attack -= 4;
                break;
            case ItemCategory.Armor:
                player.specs.defense -= 5;
                player.specs.speed += 1;
                break;
            case ItemCategory.Flask:
                player.specs.attack -= 4;
                break;
        }
    }

    onItem(player: Player, gameId: string): boolean {
        return this.gameCreationService
            .getGameById(gameId)
            .items.some((item) => item.coordinate.x === player.position.x && item.coordinate.y === player.position.y);
    }
}
