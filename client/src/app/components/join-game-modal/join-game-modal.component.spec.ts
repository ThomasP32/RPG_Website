import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameCreationEvents } from '@common/events/game-creation.events';
import { of, Subject } from 'rxjs';
import { JoinGameModalComponent } from './join-game-modal.component';

describe('JoinGameModalComponent', () => {
    let component: JoinGameModalComponent;
    let fixture: ComponentFixture<JoinGameModalComponent>;
    let mockSocketService: jasmine.SpyObj<SocketService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let gameAccessedSubject: Subject<any>;
    let gameNotFoundSubject: Subject<any>;
    let gameLockedSubject: Subject<any>;

    beforeEach(async () => {
        mockSocketService = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);

        gameAccessedSubject = new Subject();
        gameNotFoundSubject = new Subject();
        gameLockedSubject = new Subject();

        mockSocketService.listen.and.callFake((eventName: string) => {
            switch (eventName) {
                case GameCreationEvents.GameAccessed:
                    return gameAccessedSubject.asObservable();
                case GameCreationEvents.GameNotFound:
                    return gameNotFoundSubject.asObservable();
                case GameCreationEvents.GameLocked:
                    return gameLockedSubject.asObservable();
                default:
                    return of(null);
            }
        });

        await TestBed.configureTestingModule({
            imports: [FormsModule],
            providers: [
                { provide: SocketService, useValue: mockSocketService },
                { provide: Router, useValue: mockRouter },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(JoinGameModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize socket event listeners on ngOnInit', () => {
        spyOn(component, 'configureJoinGameSocketFeatures');
        component.ngOnInit();
        expect(component.configureJoinGameSocketFeatures).toHaveBeenCalled();
    });

    it('should send game code via socket on joinGame', () => {
        component.code = ['1', '2', '3', '4'];
        const event = { target: { value: '4' } };
        component.joinGame(event);
        expect(mockSocketService.sendMessage).toHaveBeenCalledWith(GameCreationEvents.AccessGame, '1234');
    });

    it('should navigate to create-character on gameAccessed event', () => {
        component.code = ['1', '2', '3', '4'];
        component.gameId = '1234';
        component.configureJoinGameSocketFeatures();
        gameAccessedSubject.next(null);
        expect(mockRouter.navigate).toHaveBeenCalledWith([`join-game/1234/create-character`]);
    });

    it('should set errorMessage on gameNotFound event', () => {
        const errorResponse = 'Game not found';
        component.configureJoinGameSocketFeatures();
        gameNotFoundSubject.next(errorResponse);
        expect(component.errorMessage).toBe('Game not found');
    });

    it('should set errorMessage on gameLocked event', () => {
        const errorResponse = 'Game is locked';
        component.configureJoinGameSocketFeatures();
        gameLockedSubject.next(errorResponse);
        expect(component.errorMessage).toBe('Game is locked');
    });

    it('should not move to the next input if the value is not a digit', () => {
        const event = { target: { value: 'a' } };
        component.codeInputs = {
            toArray: () => [
                { nativeElement: { focus: jasmine.createSpy('focus') } },
                { nativeElement: { focus: jasmine.createSpy('focus') } },
                { nativeElement: { focus: jasmine.createSpy('focus') } },
                { nativeElement: { focus: jasmine.createSpy('focus') } },
            ],
        } as any;

        component.moveToNext(event, 0);

        expect(component.codeInputs.toArray()[1].nativeElement.focus).not.toHaveBeenCalled();
    });

    it('should not move to the next input if the index is out of bounds', () => {
        const event = { target: { value: '1' } };
        component.codeInputs = {
            toArray: () => [
                { nativeElement: { focus: jasmine.createSpy('focus') } },
                { nativeElement: { focus: jasmine.createSpy('focus') } },
                { nativeElement: { focus: jasmine.createSpy('focus') } },
                { nativeElement: { focus: jasmine.createSpy('focus') } },
            ],
        } as any;

        component.moveToNext(event, 3);

        expect(component.codeInputs.toArray()[3].nativeElement.focus).not.toHaveBeenCalled();
    });
});
