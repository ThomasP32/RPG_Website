import { CommonModule, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';

@Component({
    selector: 'app-chatroom',
    standalone: true,
    imports: [FormsModule, NgFor, MatExpansionModule, CommonModule],
    templateUrl: './chatroom.component.html',
    styleUrl: './chatroom.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatroomComponent {
    readonly panelOpenState = signal(false);
    messageText: string = '';
    @Input() player: { name: string } = { name: '' };
    allMessages: { author: string; text: string; timestamp: Date; gameId: string }[] = [];
    filteredMessages: { author: string; text: string; timestamp: Date }[] = [];
    currentGameId = '';
    canChat = true;

    constructor(public socketService: SocketService) {}

    get socketId() {
        return (this.currentGameId = this.socketService.socket.id ? this.socketService.socket.id : '');
    }

    ngOnInit(): void {
        this.socketService.connect();

        this.socketService.listen('playerJoined', (data: { name: string }) => {
            this.player.name = data.name;
        });
        this.socketService.listen('chatMessage', (msg: { author: string; text: string; timestamp: Date; gameId: string }) => {
            this.allMessages.push(msg);
            this.filterMessages();
            this.scrollToBottom();
        });
    }

    connect() {
        if (!this.socketService.isSocketAlive()) {
            this.socketService.connect();
        }
    }

    sendMessage(): void {
        if (this.messageText.trim().length > 0 && this.messageText.trim().length <= 200) {
            const message = {
                author: this.player.name,
                text: this.messageText,
                timestamp: new Date(),
                gameId: this.currentGameId,
            };
            this.socketService.sendMessage('roomMessage', message);
            this.allMessages.push(message);
            this.filterMessages();
            this.messageText = '';
            this.scrollToBottom();
        }
    }

    filterMessages(): void {
        this.filteredMessages = this.allMessages.filter((msg) => msg.gameId === this.currentGameId);
    }

    scrollToBottom(): void {
        setTimeout(() => {
            const messageArea = document.getElementById('messageArea');
            if (messageArea) {
                messageArea.scrollTop = messageArea.scrollHeight;
            }
        }, 100);
    }
}
