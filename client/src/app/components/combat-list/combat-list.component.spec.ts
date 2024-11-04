import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CombatListComponent } from './combat-list.component';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameService } from '@app/services/game/game.service';
import { Player, Specs } from '@common/game';

describe('CombatListComponent', () => {
    let component: CombatListComponent;
    let fixture: ComponentFixture<CombatListComponent>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    const mockPlayer: Player = { socketId: '1', name: 'Opponent1', avatar: 1, isActive: true, position: { x: 0, y: 0 }, specs: {} as Specs } as Player;
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

    it('should send "startCombat" message with gameId and opponent when attack is called', () => {
        component.attack(mockPlayer);
        expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('startCombat', { gameId: mockGameId, opponent: mockPlayer });
    });
});
