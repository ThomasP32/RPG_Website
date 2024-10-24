import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { of, Subscription } from 'rxjs';
import { ChatroomComponent } from './chatroom.component';

describe('ChatroomComponent', () => {
    let component: ChatroomComponent;
    let fixture: ComponentFixture<ChatroomComponent>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;

    beforeEach(async () => {
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen']);
        socketServiceSpy.listen.and.returnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [FormsModule, ChatroomComponent],
            providers: [{ provide: SocketService, useValue: socketServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatroomComponent);
        component = fixture.componentInstance;
        component.player = { name: 'user1' };
        component.gameId = '1234';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize and join room with previous messages', () => {
        const previousMessages = [{ text: 'Hello', author: 'user2', timestamp: new Date(), gameId: '1234' }];
        socketServiceSpy.listen.and.returnValue(of(previousMessages));

        component.ngOnInit();
        expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('joinRoom', component.gameId);
        expect(component.messages).toEqual(previousMessages);
    });

    it('should send valid message and reset messageText', () => {
        component.messageText = 'Test message';
        component.sendMessage();
        expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('message', {
            roomName: component.gameId,
            message: jasmine.objectContaining({
                author: component.player.name,
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
});
