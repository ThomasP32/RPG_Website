// server/src/services/socketManager.service.ts
import { Message } from '@common/message';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatroomService {
    private roomMessages: Record<string, Message[]> = {};

    addMessage(roomId: string, message: Message): void {
        if (!this.roomMessages[roomId]) {
            this.roomMessages[roomId] = [];
        }
        this.roomMessages[roomId].push(message);
    }

    getMessages(roomId: string): Message[] {
        return this.roomMessages[roomId] || [];
    }
}
