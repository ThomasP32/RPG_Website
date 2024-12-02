import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { ProfileType } from '@common/constants';
import { GameCreationEvents } from '@common/events/game-creation.events';
import { Avatar, Bonus, Player } from '@common/game';
import { ItemCategory } from '@common/map.types';
import { PlayersListComponent } from './players-list.component';

describe('PlayersListComponent', () => {
    let component: PlayersListComponent;
    let fixture: ComponentFixture<PlayersListComponent>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let characterService: CharacterService;

    const mockCharacterService = {
        getAvatarPreview: jasmine.createSpy('getAvatarPreview').and.callFake((avatar: Avatar) => {
            const mockCharacters = [
                { id: Avatar.Avatar1, preview: '../../assets/previewcharacters/1.png' },
                { id: Avatar.Avatar2, preview: '../../assets/previewcharacters/2.png' },
            ];
            const foundCharacter = mockCharacters.find((character) => character.id === avatar);
            return foundCharacter ? foundCharacter.preview : '';
        }),
    };

    const mockPlayers: Player[] = [
        {
            socketId: 'hostId',
            name: 'Player1',
            avatar: Avatar.Avatar1,
            isActive: true,
            specs: {
                life: 100,
                speed: 10,
                attack: 15,
                defense: 12,
                attackBonus: Bonus.D6,
                defenseBonus: Bonus.D4,
                movePoints: 5,
                actions: 2,
                evasions: 2,
                nVictories: 3,
                nDefeats: 1,
                nCombats: 4,
                nEvasions: 1,
                nLifeTaken: 50,
                nLifeLost: 30,
                nItemsUsed: 0,
            },
            inventory: [ItemCategory.Armor, ItemCategory.Sword],
            position: { x: 1, y: 2 },
            initialPosition: { x: 1, y: 2 },
            turn: 1,
            visitedTiles: [],
            profile: ProfileType.NORMAL,
        },
        {
            socketId: 'player1Id',
            name: 'Player2',
            avatar: Avatar.Avatar1,
            isActive: true,
            specs: {
                life: 100,
                speed: 10,
                attack: 15,
                defense: 12,
                attackBonus: Bonus.D6,
                defenseBonus: Bonus.D4,
                movePoints: 5,
                evasions: 2,
                actions: 2,
                nVictories: 3,
                nDefeats: 1,
                nCombats: 4,
                nEvasions: 1,
                nLifeTaken: 50,
                nLifeLost: 30,
                nItemsUsed: 0,
            },
            inventory: [ItemCategory.Armor, ItemCategory.Sword],
            position: { x: 1, y: 2 },
            initialPosition: { x: 1, y: 2 },
            turn: 1,
            visitedTiles: [],
            profile: ProfileType.NORMAL,
        },
    ];

    beforeEach(async () => {
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage']);

        await TestBed.configureTestingModule({
            imports: [PlayersListComponent],
            providers: [
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: CharacterService, useValue: mockCharacterService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayersListComponent);
        component = fixture.componentInstance;
        characterService = TestBed.inject(CharacterService);

        component.players = mockPlayers;
        component.isHost = true;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return the correct preview URL for a given avatar', () => {
        const avatarPreview = component.getAvatarPreview(Avatar.Avatar1);
        expect(avatarPreview).toBe('../../assets/previewcharacters/1.png');
        expect(characterService.getAvatarPreview).toHaveBeenCalledWith(Avatar.Avatar1);
    });

    describe('checkHostPlayerId', () => {
        it("should set hostPlayerId to the first player's socketId if it is empty and conditions are met", () => {
            component.hostPlayerId = '';
            component.hoveredPlayerId = 'hostId';
            component.checkHostPlayerId();
            expect(component.hostPlayerId).toBe('hostId');
        });

        it('should not change hostPlayerId if isHost is false', () => {
            component.isHost = false;
            component.hostPlayerId = '';
            component.hoveredPlayerId = 'hostId';
            component.checkHostPlayerId();
            expect(component.hostPlayerId).toBe('');
        });

        it('should not change hostPlayerId if hoveredPlayerId is null', () => {
            component.hostPlayerId = '';
            component.hoveredPlayerId = null;
            component.checkHostPlayerId();
            expect(component.hostPlayerId).toBe('');
        });

        it("should set hostPlayerId to the first player's socketId if it is empty", () => {
            component.hostPlayerId = '';
            component.hoveredPlayerId = 'hostId';
            component.checkHostPlayerId();
            expect(component.hostPlayerId).toBe('hostId');
        });
    });

    describe('kickPlayer', () => {
        it('should call sendMessage with the correct player ID and game ID', () => {
            const playerId = 'player1Id';
            component.gameId = 'game123';
            component.kickPlayer(playerId);
            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith(GameCreationEvents.KickPlayer, { playerId: playerId, gameId: 'game123' });
        });

        it('should not call sendMessage if playerId is empty', () => {
            component.gameId = 'game123';
            expect(socketServiceSpy.sendMessage).not.toHaveBeenCalled();
        });
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
