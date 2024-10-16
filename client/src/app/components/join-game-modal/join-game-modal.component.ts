import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';

@Component({
    selector: 'app-join-game-modal',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './join-game-modal.component.html',
    styleUrl: './join-game-modal.component.scss',
})
export class JoinGameModalComponent {
    code: string[] = ['', '', '', ''];
    gameId: string | null = null;
    errorMessage: string | null = null;

    constructor(
        private socketService: SocketService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.configureJoinGameSocketFeatures();
    }

    moveToNext(event: any, index: number): void {
        const input = event.target;
        const value = input.value.replace(/[^0-9]/g, '');
        input.value = value;
    
        if (value.length === 1 && index < 4) {
            const nextInput = document.querySelectorAll('input')[index];
            if (nextInput) {
                (nextInput as HTMLElement).focus();
            }
        }
    
        // Move to the previous input field when backspace is pressed
        if (event.inputType === 'deleteContentBackward' && index > 0) {
            const prevInput = document.querySelectorAll('input')[index - 1];
            if (prevInput) {
                (prevInput as HTMLElement).focus();
            }
        }
    }

    joinGame(): void {
        const gameCode = this.code.join('');
        this.gameId = gameCode;

        this.socketService.sendMessage('accessGame', gameCode);

        this.code = ['', '', '', ''];
    }

    configureJoinGameSocketFeatures(): void {
        this.socketService.listen('gameAccessed').subscribe(() => {
            this.router.navigate(['/create-character']);
        });

        this.socketService.listen('gameNotFound').subscribe((data: any) => {
            this.errorMessage = data.reason;
        });

        this.socketService.listen('gameLocked').subscribe((data: any) => {
            this.errorMessage = data.reason;
        });
    }
}
