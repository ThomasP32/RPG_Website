import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharacterService } from '@app/services/character/character.service';
import { Avatar, Player } from '@common/game';
import { ItemCategory } from '@common/map.types';
import { GamePlayersListComponent } from './game-players-list.component';

describe('GamePlayersListComponent', () => {
    let component: GamePlayersListComponent;
    let fixture: ComponentFixture<GamePlayersListComponent>;
    let characterService: CharacterService;

    beforeEach(async () => {
        const characterServiceSpy = jasmine.createSpyObj<CharacterService>('CharacterService', ['getAvatarPreview']);
        characterServiceSpy.getAvatarPreview.and.returnValue('avatar-url');

        await TestBed.configureTestingModule({
            imports: [GamePlayersListComponent, CommonModule],
            providers: [{ provide: CharacterService, useValue: characterServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePlayersListComponent);
        component = fixture.componentInstance;
        characterService = TestBed.inject(CharacterService) as jasmine.SpyObj<CharacterService>;

        component.players = [
            {
                turn: 2,
                isActive: true,
                socketId: '123',
                avatar: {},
                specs: { nVictories: 0 },
                inventory: [ItemCategory.WallBreaker, ItemCategory.Armor],
            } as Player,
            {
                turn: 1,
                isActive: false,
                socketId: '456',
                avatar: {},
                specs: { nVictories: 0 },
                inventory: [ItemCategory.WallBreaker, ItemCategory.Armor],
            } as Player,
        ];
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should sort players by turn', () => {
        component.sortPlayersByTurn();
        expect(component.players[0].turn).toBe(1);
        expect(component.players[1].turn).toBe(2);
    });

    it('should return avatar preview from character service', () => {
        const avatar = {} as Avatar;
        const result = component.getAvatarPreview(avatar);
        expect(characterService.getAvatarPreview).toHaveBeenCalledWith(avatar);
        expect(result).toBe('avatar-url');
    });

    it('should identify the host player', () => {
        component.hostSocketId = '123';
        expect(component.isHostPlayer('123')).toBe(true);
        expect(component.isHostPlayer('456')).toBe(false);
    });

    it('should return true if socketId contains "virtualPlayer"', () => {
        const socketId = 'virtualPlayer123';
        expect(component.isVirtualPlayerSocketId(socketId)).toBeTrue();
    });

    it('should return false if socketId does not contain "virtualPlayer"', () => {
        const socketId = 'player123';
        expect(component.isVirtualPlayerSocketId(socketId)).toBeFalse();
    });
});
