import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { of } from 'rxjs';
import { JoinGameModalComponent } from './join-game-modal.component';

describe('JoinGameModalComponent', () => {
    let component: JoinGameModalComponent;
    let fixture: ComponentFixture<JoinGameModalComponent>;
    let mockSocketService: jasmine.SpyObj<SocketService>;
    let mockRouter: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        mockSocketService = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);

        mockSocketService.listen.and.returnValue(of(null));

        await TestBed.configureTestingModule({
            imports: [JoinGameModalComponent, FormsModule],
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

    // it('should move to the next input on valid input in moveToNext', () => {
    //     const inputElement1 = document.createElement('input');
    //     const inputElement2 = document.createElement('input');
    //     inputElement1.value = '5';

    //     const nodeList = {
    //         length: 4,
    //         item: (index: number) => (index === 1 ? inputElement2 : inputElement1),
    //         [Symbol.iterator]: function* () {
    //             yield inputElement1;
    //             yield inputElement2;
    //             yield inputElement1;
    //             yield inputElement1;
    //         },
    //     } as unknown as NodeListOf<Element>;

    //     spyOn(inputElement2, 'focus');
    //     spyOn(document, 'querySelectorAll').and.returnValue(nodeList);

    //     const event = { target: inputElement1, inputType: 'insertText' };
    //     component.moveToNext(event, 1);

    //     expect(document.querySelectorAll).toHaveBeenCalledWith('input');
    //     expect(inputElement2.focus).toHaveBeenCalled();
    // });

    // it('should move to the previous input on backspace in moveToNext', () => {
    //     const inputElement = document.createElement('input');

    //     const nodeList = {
    //         length: 4,
    //         item: (index: number) => inputElement,
    //         [Symbol.iterator]: function* () {
    //             yield inputElement;
    //             yield inputElement;
    //             yield inputElement;
    //             yield inputElement;
    //         },
    //     } as unknown as NodeListOf<Element>;

    //     spyOn(document, 'querySelectorAll').and.returnValue(nodeList);

    //     const event = { target: inputElement, inputType: 'deleteContentBackward' };
    //     component.moveToNext(event, 2); // Move to previous input from index 2
    //     expect(document.querySelectorAll).toHaveBeenCalledWith('input');
    // });

    it('should send game code via socket on joinGame', () => {
        component.code = ['1', '2', '3', '4'];
        component.joinGame();
        expect(mockSocketService.sendMessage).toHaveBeenCalledWith('accessGame', '1234');
    });

    it('should reset the code array after calling joinGame', () => {
        component.code = ['1', '2', '3', '4'];
        component.joinGame();
        expect(component.code).toEqual(['', '', '', '']);
    });

    it('should navigate to create-character on gameAccessed event', () => {
        component.code = ['1', '2', '3', '4'];
        component.gameId = '1234';

        mockSocketService.listen.and.returnValue(of(null));
        component.configureJoinGameSocketFeatures();

        mockSocketService.listen('gameAccessed').subscribe(() => {
            expect(mockRouter.navigate).toHaveBeenCalledWith([`join-game/1234/create-character`]);
        });
    });

    it('should set errorMessage on gameNotFound event', () => {
        const errorResponse = { reason: 'Game not found' };
        mockSocketService.listen.and.returnValue(of(errorResponse));
        component.configureJoinGameSocketFeatures();
        expect(component.errorMessage).toBe('Game not found');
    });

    it('should set errorMessage on gameLocked event', () => {
        const errorResponse = { reason: 'Game is locked' };
        mockSocketService.listen.and.returnValue(of(errorResponse));
        component.configureJoinGameSocketFeatures();
        expect(component.errorMessage).toBe('Game is locked');
    });
});
