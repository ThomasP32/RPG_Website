import { CommonModule, NgFor } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Message } from '@common/message';

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

    constructor(public socketService: SocketService) {}

    ngOnInit(): void {
        this.socketService.sendMessage('joinRoom', this.gameId);
        this.socketService.listen('roomMessage', (msg: { author: string; text: string; timestamp: Date; gameId: string }) => {
            this.messages.push(msg);
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
            this.socketService.sendMessage('roomMessage', { roomName: this.gameId, message });
            this.messageText = '';
        }
    }
}
