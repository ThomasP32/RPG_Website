import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-join-game-modal',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './join-game-modal.component.html',
    styleUrl: './join-game-modal.component.scss',
})
export class JoinGameModalComponent implements OnInit {
    @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef>;

    code: string[] = ['', '', '', ''];
    gameId: string | null = null;
    errorMessage: string | null = null;
    socketSubscription: Subscription = new Subscription();

    constructor(
        // eslint-disable-next-line no-unused-vars
        private socketService: SocketService,
        // eslint-disable-next-line no-unused-vars
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
            const nextInput = this.codeInputs.toArray()[index];
            if (nextInput) {
                nextInput.nativeElement.focus();
            }
        }

        if (event.inputType === 'deleteContentBackward' && index > 0) {
            const prevInput = this.codeInputs.toArray()[index - 1];
            if (prevInput) {
                prevInput.nativeElement.focus();
            }
        }
    }

    joinGame(): void {
        const gameCode = this.code.join('');
        this.gameId = gameCode;

        // accéder au choix de joeur avant de join
        this.socketService.sendMessage('accessGame', gameCode);
        // this.socketService.sendMessage('joinGame', gameCode);

        this.code = ['', '', '', ''];
    }

    configureJoinGameSocketFeatures(): void {
        this.socketSubscription.add(
            this.socketService.listen('gameAccessed').subscribe(() => {
                // quand le jeu a été accédé, on peut accéder au choix de joueur
                this.router.navigate([`join-game/${this.gameId}/create-character`]);
            }),
        );

        // accéder au choix de joeur avant de join
        // this.socketService.listen('playerJoined').subscribe(() => {
        //     this.router.navigate(['/create-character']);
        // });

        this.socketSubscription.add(
            this.socketService.listen('gameNotFound').subscribe((data: any) => {
                if (data && data.reason) {
                    this.errorMessage = data.reason;
                }
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen('gameLocked').subscribe((data: any) => {
                if (data && data.reason) {
                    this.errorMessage = data.reason;
                }
            }),
        );
    }
}
