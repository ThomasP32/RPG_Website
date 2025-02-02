import {
    AMULET_LIFE_BONUS,
    ARMOR_DEFENSE_BONUS,
    ARMOR_SPEED_PENALTY,
    FLASK_ATTACK_BONUS,
    SWORD_ATTACK_BONUS,
    SWORD_SPEED_BONUS,
} from '@common/constants';
import { GameCtf, Player } from '@common/game';
import { Coordinate, ItemCategory, Mode } from '@common/map.types';
import { Inject, Injectable } from '@nestjs/common';
import { GameCreationService } from '../game-creation/game-creation.service';
import { GameManagerService } from '../game-manager/game-manager.service';
import { JournalService } from '../journal/journal.service';

@Injectable()
export class ItemsManagerService {
    @Inject(GameCreationService) private readonly gameCreationService: GameCreationService;
    @Inject(GameManagerService) private readonly gameManagerService: GameManagerService;
    @Inject(JournalService) private readonly journalService: JournalService;

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
            player.specs.nItemsUsed++;
            if (item === ItemCategory.Flag) {
                if (game.mode === Mode.Ctf) {
                    (game as GameCtf).nPlayersCtf.push(player);
                }
            }
            game.items.splice(itemIndex, 1);

            const involvedPlayers = game.players.map((player) => player.name);

            this.journalService.logMessage(gameId, `${player.name}. a ramassé un item !`, involvedPlayers);

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
            if (item === ItemCategory.Sword || item === ItemCategory.Armor) this.activateItem(item, player);
        }
    }

    activateItem(item: ItemCategory, player: Player): void {
        switch (item) {
            case ItemCategory.Sword:
                player.specs.speed += SWORD_SPEED_BONUS;
                player.specs.attack += SWORD_ATTACK_BONUS;
                break;
            case ItemCategory.Armor:
                player.specs.defense += ARMOR_DEFENSE_BONUS;
                player.specs.speed -= ARMOR_SPEED_PENALTY;
                break;
            case ItemCategory.Flask:
                player.specs.attack += FLASK_ATTACK_BONUS;
                break;
            case ItemCategory.Amulet:
                player.specs.life += AMULET_LIFE_BONUS;
        }
    }

    desactivateItem(item: ItemCategory, player: Player): void {
        switch (item) {
            case ItemCategory.Sword:
                player.specs.speed -= SWORD_SPEED_BONUS;
                player.specs.attack -= SWORD_ATTACK_BONUS;
                break;
            case ItemCategory.Armor:
                player.specs.defense -= ARMOR_DEFENSE_BONUS;
                player.specs.speed += ARMOR_SPEED_PENALTY;
                break;
            case ItemCategory.Flask:
                player.specs.attack -= FLASK_ATTACK_BONUS;
                break;
            case ItemCategory.Amulet:
                player.specs.life -= AMULET_LIFE_BONUS;
        }
    }

    onItem(player: Player, gameId: string): boolean {
        return this.gameCreationService
            .getGameById(gameId)
            .items.some((item) => item.coordinate.x === player.position.x && item.coordinate.y === player.position.y);
    }

    checkForAmulet(challenger: Player, opponent: Player): void {
        if (challenger.inventory.includes(ItemCategory.Amulet) && opponent.specs.life > challenger.specs.life) {
            this.activateItem(ItemCategory.Amulet, challenger);
        }
        if (opponent.inventory.includes(ItemCategory.Amulet) && challenger.specs.life > opponent.specs.life) {
            this.activateItem(ItemCategory.Amulet, opponent);
        }
    }
}
