import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { of, Subscription } from 'rxjs';
import { ChatroomComponent } from './chatroom.component';

describe('ChatroomComponent', () => {
    let component: ChatroomComponent;
    let fixture: ComponentFixture<ChatroomComponent>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let mockRouter: any;

    beforeEach(async () => {
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen']);
        socketServiceSpy.listen.and.returnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [FormsModule, ChatroomComponent],
            providers: [
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: Router, useValue: mockRouter },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatroomComponent);
        component = fixture.componentInstance;
        component.playerName = 'user1';
        component.gameId = '1234';
        fixture.detectChanges();
    });

    mockRouter = {
        get url() {
            return '/game-page';
        },
        navigate: jasmine.createSpy('navigate'),
    };

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set isGamePage to true and isWaitingRoom to false when on /game-page', () => {
        spyOnProperty(mockRouter, 'url', 'get').and.returnValue('/game-page');

        component.ngOnInit();
        fixture.detectChanges();

        expect(component.isGamePage).toBeTrue();
        expect(component.isWaitingRoom).toBeFalse();
    });

    it('should set isWaitingRoom to true and isGamePage to false when on /waiting-room', () => {
        spyOnProperty(mockRouter, 'url', 'get').and.returnValue('/waiting-room');

        component.ngOnInit();
        fixture.detectChanges();

        expect(component.isWaitingRoom).toBeTrue();
        expect(component.isGamePage).toBeFalse();
    });

    it('should initialize and join room with previous messages', () => {
        const previousMessages = [{ text: 'Hello', author: 'user2', timestamp: new Date(), gameId: '1234' }];
        socketServiceSpy.listen.and.returnValue(of(previousMessages));
        component.ngOnInit();
        expect(component.messages).toEqual(previousMessages);
    });

    it('should send valid message and reset messageText', () => {
        component.messageText = 'Test message';
        component.sendMessage();
        expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('message', {
            roomName: component.gameId,
            message: jasmine.objectContaining({
                author: component.playerName,
                text: 'Test message',
                timestamp: jasmine.any(Date),
            }),
        });
        expect(component.messageText).toBe('');
    });

    it('should unsubscribe from messageSubscription on destroy', () => {
        component.messageSubscription = new Subscription();
        spyOn(component.messageSubscription, 'unsubscribe');
        component.ngOnDestroy();
        expect(component.messageSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should toggle isChatRetracted when toggleChat is called', () => {
        component.isChatRetracted = false;
        component.toggleChat();
        expect(component.isChatRetracted).toBeTrue();

        component.toggleChat();
        expect(component.isChatRetracted).toBeFalse();
    });

    it('should scroll to bottom when scrollToBottom is called', (done) => {
        const messageArea = document.createElement('div');
        messageArea.id = 'messageArea';
        document.body.appendChild(messageArea);
        spyOn(document, 'getElementById').and.returnValue(messageArea);

        component.scrollToBottom();

        setTimeout(() => {
            expect(messageArea.scrollTop).toBe(messageArea.scrollHeight);
            document.body.removeChild(messageArea);
            done();
        }, 10);
    });
});
