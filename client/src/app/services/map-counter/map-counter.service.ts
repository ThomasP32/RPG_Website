import { Injectable } from '@angular/core';
import { Item, ItemCategory } from '@common/map.types';
import { Subject } from 'rxjs';
import { MapConversionService } from '../map-conversion/map-conversion.service';
@Injectable({
    providedIn: 'root',
})
export class MapCounterService {
    items: ItemCategory[] = [];

    startingPointCounter: number;

    randomItemCounter: number;

    itemsCounter: number;

    private startingPointCounterSource = new Subject<number>();
    startingPointCounter$ = this.startingPointCounterSource.asObservable();

    constructor(private mapConversionService: MapConversionService) {
        this.mapConversionService = mapConversionService;
    }

    updateCounters(isStartingPoint: boolean, action: 'add' | 'remove') {
        if (isStartingPoint) {
            action === 'add' ? this.startingPointCounter++ : this.startingPointCounter--;
        }
    }

    initializeCounters(mapSize: number, mode: string) {
        this.startingPointCounter = this.mapConversionService.getMaxPlayers(mapSize);
        this.randomItemCounter = this.mapConversionService.getNbItems(mapSize);
        this.itemsCounter = this.mapConversionService.getNbItems(mapSize);
        this.setAvailablesItems();
        if (mode === 'ctf') {
            this.items.push(ItemCategory.Flag);
        }
    }

    loadMapCounters(usedItems: Item[]) {
        const usedCategories = new Set(usedItems.map((item) => item.category));

        this.items = this.items.filter((item) => !usedCategories.has(item));

        const randomItemCount = usedItems.filter((item) => item.category === ItemCategory.Random).length;
        this.itemsCounter -= randomItemCount;
        this.randomItemCounter -= randomItemCount;
    }
    setAvailablesItems() {
        this.items = [
            ItemCategory.Armor,
            ItemCategory.IceSkates,
            ItemCategory.GrapplingHook,
            ItemCategory.Flask,
            ItemCategory.TimeTwister,
            ItemCategory.Sword,
        ];
    }

    isItemUsed(item: ItemCategory): boolean {
        return !this.items.includes(item);
    }

    useItem(item: ItemCategory) {
        if (item != ItemCategory.Flag) {
            this.itemsCounter -= 1;
        }
        this.items = this.items.filter((i) => i !== item);
    }

    releaseItem(item: ItemCategory) {
        if (item != ItemCategory.Flag) {
            this.itemsCounter += 1;
        }
        this.items.push(item);
    }
}
