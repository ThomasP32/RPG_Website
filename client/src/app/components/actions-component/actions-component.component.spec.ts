import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { GameService } from '@app/services/game/game.service';
import { CombatEvents } from '@common/events/combat.events';
import { Avatar, Bonus, Player } from '@common/game';
import { DoorTile, ItemCategory, Tile, TileCategory } from '@common/map.types';
import { of } from 'rxjs';
import { ActionsComponentComponent } from './actions-component.component';

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
        nEvasions: 0,
        nLifeTaken: 0,
        nLifeLost: 0,
    },
    inventory: [ItemCategory.Amulet, ItemCategory.Armor],
    turn: 0,
    visitedTiles: [],
};

describe('ActionsComponentComponent', () => {
    let component: ActionsComponentComponent;
    let fixture: ComponentFixture<ActionsComponentComponent>;
    let gameTurnService: GameTurnService;
    let socketService: SocketService;
    let gameService: GameService;

    beforeEach(async () => {
        gameTurnService = jasmine.createSpyObj('GameTurnService', ['toggleDoor', 'breakWall', 'endTurn', 'listenForPossibleActions'], {
            possibleOpponents$: of([]),
            possibleDoors$: of([]),
            possibleWalls$: of([]),
            possibleActions: { door: true },
        });
        socketService = jasmine.createSpyObj('SocketService', ['sendMessage']);
        gameService = { game: { id: 'test-game-id' } } as GameService;

        await TestBed.configureTestingModule({
            imports: [ActionsComponentComponent],
            providers: [
                { provide: GameTurnService, useValue: gameTurnService },
                { provide: SocketService, useValue: socketService },
                { provide: GameService, useValue: gameService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ActionsComponentComponent);
        component = fixture.componentInstance;
        component.player = mockPlayer;
        component.currentPlayerTurn = 'Test Player';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show description', () => {
        component.showDescription('Test Description');
        expect(component.actionDescription).toBe('Test Description');
    });

    it('should hide description', () => {
        component.hideDescription();
        expect(component.actionDescription).toBeNull();
    });

    it('should fight when combat is available and one opponent', () => {
        component.combatAvailable = true;
        component.possibleOpponents = [mockPlayer];
        component.fight();
        expect(socketService.sendMessage).toHaveBeenCalledWith(CombatEvents.StartCombat, {
            gameId: 'test-game-id',
            opponent: mockPlayer,
        });
    });

    it('should show combat modal when combat is available and multiple opponents', () => {
        component.combatAvailable = true;
        component.possibleOpponents = [mockPlayer, mockPlayer];
        component.fight();
        expect(component.showCombatModal).toBeTrue();
    });

    it('should toggle door when door action is available and one door', () => {
        component.doorActionAvailable = true;
        component.possibleDoors = [{ coordinate: { x: 0, y: 0 }, isOpened: true } as DoorTile];
        component.toggleDoor();
        expect(gameTurnService.toggleDoor).toHaveBeenCalledWith(component.possibleDoors[0]);
    });

    it('should show door modal when door action is available and multiple doors', () => {
        component.doorActionAvailable = true;
        component.possibleDoors = [
            { coordinate: { x: 0, y: 0 }, isOpened: true } as DoorTile,
            { coordinate: { x: 1, y: 1 }, isOpened: true } as DoorTile,
        ];
        component.toggleDoor();
        expect(component.showDoorModal).toBeTrue();
    });

    it('should break wall when wall action is available', () => {
        component.breakWallActionAvailable = true;
        component.possibleWalls = [{ coordinate: { x: 0, y: 0 }, category: TileCategory.Wall } as Tile];
        component.breakWall();
        expect(gameTurnService.breakWall).toHaveBeenCalledWith(component.possibleWalls[0]);
    });

    it('should end turn', () => {
        component.endTurn();
        expect(gameTurnService.endTurn).toHaveBeenCalled();
    });

    it('should open exit confirmation modal', () => {
        spyOn(component.showExitModalChange, 'emit');
        component.openExitConfirmationModal();
        expect(component.showExitModal).toBeTrue();
        expect(component.showExitModalChange.emit).toHaveBeenCalledWith(true);
    });

    it("should return true if it is this player's turn", () => {
        expect(component.thisPlayerTurn()).toBeTrue();
    });

    it("should return false if it is not this player's turn", () => {
        component.currentPlayerTurn = 'Other Player';
        expect(component.thisPlayerTurn()).toBeFalse();
    });
});
