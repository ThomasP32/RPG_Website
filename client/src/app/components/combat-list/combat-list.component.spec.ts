import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameService } from '@app/services/game/game.service';
import { CombatEvents } from '@common/events/combat.events';
import { Player, Specs } from '@common/game';
import { CombatListComponent } from './combat-list.component';

describe('CombatListComponent', () => {
    let component: CombatListComponent;
    let fixture: ComponentFixture<CombatListComponent>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    const mockPlayer: Player = {
        socketId: '1',
        name: 'Opponent1',
        avatar: 1,
        isActive: true,
        position: { x: 0, y: 0 },
        specs: {} as Specs,
    } as Player;
    const mockGameId = 'game-123';

    beforeEach(async () => {
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage']);
        gameServiceSpy = jasmine.createSpyObj('GameService', [], { game: { id: mockGameId } });

        await TestBed.configureTestingModule({
            imports: [CombatListComponent],
            providers: [
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CombatListComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should reset combatAlreadyStarted to false when ngOnChanges is called', () => {
        component.combatAlreadyStarted = true;
        component.ngOnChanges();
        expect(component.combatAlreadyStarted).toBeFalse();
    });

    it('should send "startCombat" message with gameId and opponent when attack is called', () => {
        component.attack(mockPlayer);
        expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith(CombatEvents.StartCombat, { gameId: mockGameId, opponent: mockPlayer });
    });

    it('should set combatAlreadyStarted to true after attack is called', () => {
        component.attack(mockPlayer);
        expect(component.combatAlreadyStarted).toBeTrue();
    });

    it('should not send "startCombat" message if combatAlreadyStarted is true', () => {
        component.combatAlreadyStarted = true;
        component.attack(mockPlayer);
        expect(socketServiceSpy.sendMessage).not.toHaveBeenCalled();
    });
    it('should emit false when closeModal is called', () => {
        spyOn(component.showCombatModalChange, 'emit');
        component.closeModal();
        expect(component.showCombatModalChange.emit).toHaveBeenCalledWith(false);
    });
});
