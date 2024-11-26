import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Message } from '@common/message';
import { ChatEvents} from '@common/events/chat.events'
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-chatroom',
    standalone: true,
    imports: [FormsModule, CommonModule],
    templateUrl: './chatroom.component.html',
    styleUrl: './chatroom.component.scss',
})
export class ChatroomComponent implements OnInit, OnDestroy {
    @Input() playerName: string = '';
    @Input() gameId: string;
    messageText: string = '';
    messages: Message[] = [];
    messageSubscription: Subscription;
    isChatRetracted: boolean = false;
    isWaitingRoom: boolean;
    isGamePage: boolean;

    constructor(
        public readonly socketService: SocketService,
        private readonly router: Router,
    ) {
        this.socketService = socketService;
        this.router = router;
    }

    ngOnInit(): void {
        const currentUrl = this.router.url;
        this.isWaitingRoom = currentUrl.includes('/waiting-room');
        this.isGamePage = currentUrl.includes('/game-page');
        this.messageSubscription = this.socketService.listen<Message[]>(ChatEvents.PreviousMessages).subscribe((messages: Message[]) => {
            console.log(messages);
            this.messages = messages;
            this.scrollToBottom();
        });

        this.messageSubscription = this.socketService.listen<Message>(ChatEvents.NewMessage).subscribe((message) => {
            this.messages.push(message);
            this.scrollToBottom();
        });
    }

    sendMessage(): void {
        if (this.messageText.trim().length > 0 && this.messageText.trim().length <= 200) {
            const message: Message = {
                author: this.playerName,
                text: this.messageText,
                timestamp: new Date(),
                gameId: this.gameId,
            };
            this.socketService.sendMessage(ChatEvents.Message, { roomName: this.gameId, message });
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

    toggleChat() {
        this.isChatRetracted = !this.isChatRetracted;
    }

    ngOnDestroy(): void {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
    }
}
