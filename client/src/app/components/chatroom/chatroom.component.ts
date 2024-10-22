import { CommonModule, NgFor } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Message } from '@common/message';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-chatroom',
    standalone: true,
    imports: [FormsModule, NgFor, CommonModule],
    templateUrl: './chatroom.component.html',
    styleUrl: './chatroom.component.scss',
})
export class ChatroomComponent {
    @Input() player: { name: string } = { name: '' };
    @Input() gameId: string;
    messageText: string = '';
    messages: Message[] = [];
    messageSubscription: Subscription;

    constructor(public socketService: SocketService) {}

    ngOnInit(): void {
        this.socketService.sendMessage('joinRoom', this.gameId);
        this.messageSubscription = this.socketService.listen<Message>('message').subscribe((message) => {
            this.messages.push(message);
            this.scrollToBottom();
        });
    }

    sendMessage(): void {
        if (this.messageText.trim().length > 0 && this.messageText.trim().length <= 200) {
            const message: Message = {
                author: this.player.name,
                text: this.messageText,
                timestamp: new Date(),
                gameId: this.gameId,
            };
            this.socketService.sendMessage('message', { roomName: this.gameId, message });
            this.messageText = '';
            this.scrollToBottom();
        }
    }

    scrollToBottom(): void {
        setTimeout(() => {
            const messageArea = document.getElementById('messageArea');
            if (messageArea) {
                messageArea.scrollTop = messageArea.scrollHeight;
            }
        }, 5);
    }

    ngOnDestroy(): void {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
    }
}
