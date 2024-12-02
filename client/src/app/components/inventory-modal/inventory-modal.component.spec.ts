import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { ImageService } from '@app/services/image/image.service';
import { ProfileType } from '@common/constants';
import { Player, Specs } from '@common/game';
import { ItemCategory } from '@common/map.types';
import { InventoryModalComponent } from './inventory-modal.component';

describe('InventoryModalComponent', () => {
    let component: InventoryModalComponent;
    let fixture: ComponentFixture<InventoryModalComponent>;

    const socketSpy = jasmine.createSpyObj('SocketService', ['sendMessage']);
    const imageSpy = jasmine.createSpyObj('ImageService', ['getItemImage']);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InventoryModalComponent],
            providers: [
                { provide: SocketService, useValue: socketSpy },
                { provide: ImageService, useValue: imageSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(InventoryModalComponent);
        component = fixture.componentInstance;

        component.gameId = 'game1';
        const mockPlayer: Player = {
            socketId: 'socket-1',
            name: 'Test Player',
            avatar: 1,
            isActive: true,
            position: { x: 0, y: 0 },
            specs: { life: 100, speed: 10, attack: 10, defense: 10, movePoints: 5, actions: 2 } as Specs,
            inventory: [ItemCategory.Armor, ItemCategory.Flask],
            turn: 0,
            visitedTiles: [],
            initialPosition: { x: 0, y: 0 },
            profile: ProfileType.NORMAL,
        };

        component.player = mockPlayer;
        fixture.detectChanges();
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should call sendMessage on dropItem', () => {
        const item: ItemCategory = ItemCategory.Flask;
        component.dropItem(item);
        expect(socketSpy.sendMessage).toHaveBeenCalledWith('dropItem', { itemDropping: item, gameId: component.gameId });
    });
});
