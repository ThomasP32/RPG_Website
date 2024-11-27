import { ARMOR_DEFENSE_BONUS, ARMOR_SPEED_PENALTY, SWORD_ATTACK_BONUS, SWORD_SPEED_BONUS } from '@common/constants';
import { Player } from '@common/game';
import { Coordinate, ItemCategory } from '@common/map.types';
import { Inject, Injectable } from '@nestjs/common';
import { GameCreationService } from '../game-creation/game-creation.service';

@Injectable()
export class ItemsManagerService {
    @Inject(GameCreationService) private gameCreationService: GameCreationService;

    pickUpItem(pos: Coordinate, gameId: string, player: Player): void {
        const game = this.gameCreationService.getGameById(gameId);
        const itemIndex = game.items.findIndex((item) => item.coordinate.x === pos.x && item.coordinate.y === pos.y);
        if (itemIndex !== -1) {
            const item = game.items[itemIndex].category;
            player.inventory.push(item);
            game.items.splice(itemIndex, 1);
            this.activateItem(item, player);
        }
    }

    dropItem(itemDropping: ItemCategory, gameId: string, playerSocket: string, coordinates: Coordinate): void {
        const game = this.gameCreationService.getGameById(gameId);
        const player = game.players.find((player) => player.socketId === playerSocket);
        const itemIndex = player.inventory.findIndex((item) => item === itemDropping);
        if (itemIndex !== -1) {
            const item = player.inventory[itemIndex];
            game.items.push({ coordinate: coordinates, category: item });
            player.inventory.splice(itemIndex, 1);
            this.desactivateItem(item, player);
        }
    }

    activateItem(item: ItemCategory, player: Player): void {
        switch (item) {
            case ItemCategory.Sword:
                player.specs.speed += SWORD_ATTACK_BONUS;
                player.specs.attack += SWORD_SPEED_BONUS;
                break;
            case ItemCategory.Armor:
                player.specs.defense += ARMOR_DEFENSE_BONUS;
                player.specs.speed -= ARMOR_SPEED_PENALTY;
                break;
        }
    }

    desactivateItem(item: ItemCategory, player: Player): void {
        switch (item) {
            case ItemCategory.Sword:
                player.specs.speed -= SWORD_ATTACK_BONUS;
                player.specs.attack -= SWORD_SPEED_BONUS;
                break;
            case ItemCategory.Armor:
                player.specs.defense -= ARMOR_DEFENSE_BONUS;
                player.specs.speed += ARMOR_SPEED_PENALTY;
                break;
        }
    }

    onItem(player: Player, gameId: string): boolean {
        return this.gameCreationService
            .getGameById(gameId)
            .items.some((item) => item.coordinate.x === player.position.x && item.coordinate.y === player.position.y);
    }
}
