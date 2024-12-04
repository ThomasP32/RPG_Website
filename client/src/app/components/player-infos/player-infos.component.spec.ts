import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterService } from '@app/services/character/character.service';
import { ImageService } from '@app/services/image/image.service';
import { ProfileType } from '@common/constants';
import { Avatar, Bonus, Player } from '@common/game';
import { ItemCategory } from '@common/map.types';
import { PlayerInfosComponent } from './player-infos.component';

const mockPlayer: Player = {
    socketId: 'test-socket',
    name: 'Test Player',
    avatar: Avatar.Avatar1,
    isActive: true,
    position: { x: 0, y: 0 },
    initialPosition: { x: 0, y: 0 },
    specs: {
        evasions: 2,
        life: 100,
        speed: 10,
        attack: 10,
        defense: 10,
        movePoints: 5,
        actions: 2,
        attackBonus: Bonus.D4,
        defenseBonus: Bonus.D6,
        nVictories: 0,
        nDefeats: 0,
        nCombats: 0,
        nItemsUsed: 0,
        nEvasions: 0,
        nLifeTaken: 0,
        nLifeLost: 0,
    },
    inventory: [ItemCategory.Amulet, ItemCategory.Armor],
    turn: 0,
    visitedTiles: [],
    profile: ProfileType.NORMAL,
};

describe('PlayerInfosComponent', () => {
    let component: PlayerInfosComponent;
    let fixture: ComponentFixture<PlayerInfosComponent>;
    let characterService: jasmine.SpyObj<CharacterService>;

    beforeEach(async () => {
        const characterServiceSpy = jasmine.createSpyObj('CharacterService', ['getAvatarPreview']);
        const imageServiceSpy = jasmine.createSpyObj('ImageService', ['getItemImage', 'getDiceImage', 'getIconImage']);

        await TestBed.configureTestingModule({
            imports: [PlayerInfosComponent],
            providers: [
                { provide: CharacterService, useValue: characterServiceSpy },
                { provide: ImageService, useValue: imageServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayerInfosComponent);
        component = fixture.componentInstance;
        characterService = TestBed.inject(CharacterService) as jasmine.SpyObj<CharacterService>;

        characterService.getAvatarPreview.and.returnValue('./assets/previewcharacters/1_preview.png');

        component.player = mockPlayer;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize playerPreview with avatar preview', () => {
        component.player = mockPlayer;
        component.ngOnInit();
        fixture.detectChanges();

        expect(component.playerPreview).toBe('./assets/previewcharacters/1_preview.png');
        expect(characterService.getAvatarPreview).toHaveBeenCalledWith(Avatar.Avatar1);
    });

    it('should set player input correctly', () => {
        expect(component.player).toBe(mockPlayer);
    });
});
