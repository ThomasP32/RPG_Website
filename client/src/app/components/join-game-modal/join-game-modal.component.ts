import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameCreationEvents } from '@common/events/game-creation.events';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-join-game-modal',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './join-game-modal.component.html',
    styleUrl: './join-game-modal.component.scss',
})
export class JoinGameModalComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef>;

    code: string[] = ['', '', '', ''];
    gameId: string | null = null;
    errorMessage: string | null = null;
    socketSubscription: Subscription = new Subscription();

    constructor(
        private readonly socketService: SocketService,
        private readonly router: Router,
    ) {
        this.socketService = socketService;
        this.router = router;
    }

    ngOnInit(): void {
        this.configureJoinGameSocketFeatures();
    }

    ngAfterViewInit(): void {
        this.focusFirstInput();
    }

    focusFirstInput(): void {
        const firstInput = this.codeInputs.first;
        if (firstInput) {
            firstInput.nativeElement.focus();
        }
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
    }

    joinGame(event: any): void {
        const input = event.target;
        const value = input.value.replace(/[^0-9]/g, '');
        input.value = value;

        if (this.code.every((digit) => digit !== '')) {
            const gameCode = this.code.join('');
            this.gameId = gameCode;

            this.socketService.sendMessage(GameCreationEvents.AccessGame, gameCode);
        }
    }

    resetCodeAndFocus(): void {
        this.code = ['', '', '', ''];
        const firstInput = this.codeInputs.first;
        if (firstInput) {
            firstInput.nativeElement.focus();
        }
    }

    configureJoinGameSocketFeatures(): void {
        this.socketSubscription.add(
            this.socketService.listen(GameCreationEvents.GameAccessed).subscribe(() => {
                this.router.navigate([`join-game/${this.gameId}/create-character`]);
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<string>(GameCreationEvents.GameNotFound).subscribe((reason) => {
                if (reason) {
                    this.errorMessage = reason;
                    this.resetCodeAndFocus();
                }
            }),
        );

        this.socketSubscription.add(
            this.socketService.listen<string>(GameCreationEvents.GameLocked).subscribe((reason) => {
                if (reason) {
                    this.errorMessage = reason;
                    this.resetCodeAndFocus();
                }
            }),
        );
    }

    ngOnDestroy(): void {
        this.socketSubscription.unsubscribe();
    }
}
