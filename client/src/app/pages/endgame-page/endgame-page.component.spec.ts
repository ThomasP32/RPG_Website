import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ChatroomComponent } from '@app/components/chatroom/chatroom.component';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { ProfileType } from '@common/constants';
import { Game, Player } from '@common/game';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { EndgamePageComponent } from './endgame-page.component';

@Component({
    selector: 'app-chatroom',
    template: '<div>Mock Chatroom</div>',
    standalone: true,
})
class MockChatroomComponent {}

const mockPlayer: Player = {
    socketId: 'player-socket-id',
    name: 'Player1',
    avatar: 1,
    isActive: true,
    specs: {
        evasions: 2,
        life: 100,
        speed: 10,
        attack: 15,
        defense: 10,
        attackBonus: 4,
        defenseBonus: 4,
        movePoints: 5,
        actions: 2,
        nVictories: 0,
        nDefeats: 0,
        nCombats: 0,
        nEvasions: 0,
        nLifeTaken: 0,
        nLifeLost: 0,
        nItemsUsed: 0,
    },
    inventory: [],
    position: { x: 0, y: 0 },
    initialPosition: { x: 0, y: 0 },
    turn: 0,
    visitedTiles: [],
    profile: ProfileType.NORMAL,
};

const mockGame: Game = {
    id: 'test-game-id',
    hostSocketId: 'test-socket',
    hasStarted: true,
    currentTurn: 0,
    mapSize: { x: 10, y: 10 },
    tiles: [
        { coordinate: { x: 2, y: 2 }, category: TileCategory.Water },
        { coordinate: { x: 3, y: 3 }, category: TileCategory.Ice },
        { coordinate: { x: 4, y: 4 }, category: TileCategory.Wall },
    ],
    doorTiles: [
        { coordinate: { x: 1, y: 2 }, isOpened: false },
        { coordinate: { x: 2, y: 1 }, isOpened: true },
    ],
    startTiles: [{ coordinate: { x: 0, y: 0 } }],
    items: [{ coordinate: { x: 0, y: 1 }, category: ItemCategory.Armor }],
    players: [mockPlayer],
    mode: Mode.Classic,
    nTurns: 0,
    debug: false,
    nDoorsManipulated: [],
    duration: 0,
    isLocked: true,
    name: 'game',
    description: 'game description',
    imagePreview: 'image-preview',
};

describe('EndgamePageComponent', () => {
    let component: EndgamePageComponent;
    let fixture: ComponentFixture<EndgamePageComponent>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;
    let characterServiceSpy: jasmine.SpyObj<CharacterService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['disconnect']);
        gameServiceSpy = jasmine.createSpyObj('GameService', [], {
            game: mockGame,
        });
        playerServiceSpy = jasmine.createSpyObj('PlayerService', ['resetPlayer'], {
            player: mockPlayer,
        });
        characterServiceSpy = jasmine.createSpyObj('CharacterService', ['getAvatarPreview', 'resetCharacterAvailability']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [EndgamePageComponent, CommonModule, MockChatroomComponent],
            providers: [
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: PlayerService, useValue: playerServiceSpy },
                { provide: CharacterService, useValue: characterServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        })
            .overrideComponent(EndgamePageComponent, {
                remove: {
                    imports: [ChatroomComponent],
                },
                add: {
                    imports: [MockChatroomComponent],
                },
            })
            .compileComponents();

        fixture = TestBed.createComponent(EndgamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        socketServiceSpy = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
        gameServiceSpy = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
        playerServiceSpy = TestBed.inject(PlayerService) as jasmine.SpyObj<PlayerService>;
        characterServiceSpy = TestBed.inject(CharacterService) as jasmine.SpyObj<CharacterService>;
        routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        gameServiceSpy.game = mockGame;
        playerServiceSpy.player = mockPlayer;
        gameServiceSpy.game.players = [mockPlayer];
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Getters', () => {
        it('should get player from PlayerService', () => {
            const player = playerServiceSpy.player;
            expect(player).toEqual(mockPlayer);
        });

        it('should get game from GameService', () => {
            const game = gameServiceSpy.game;
            expect(game).toEqual(mockGame);
        });

        it('should get players from GameService', () => {
            const players = gameServiceSpy.game.players;
            expect(players).toEqual(mockGame.players);
        });
    });

    describe('Avatar Preview', () => {
        it('should get avatar preview from CharacterService', () => {
            component.getAvatarPreview(mockPlayer.avatar);
            expect(characterServiceSpy.getAvatarPreview).toHaveBeenCalledWith(mockPlayer.avatar);
        });
    });

    describe('Navigation', () => {
        it('should reset player and character availability before navigating to main menu', () => {
            component.navigateToMain();

            expect(playerServiceSpy.resetPlayer).toHaveBeenCalled();
            expect(characterServiceSpy.resetCharacterAvailability).toHaveBeenCalled();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/main-menu']);
        });
    });

    describe('Cleanup', () => {
        it('should unsubscribe and disconnect on destroy', () => {
            const subscriptionSpy = spyOn(component.socketSubscription, 'unsubscribe');

            component.ngOnDestroy();

            expect(subscriptionSpy).toHaveBeenCalled();
            expect(socketServiceSpy.disconnect).toHaveBeenCalled();
        });
    });
});
