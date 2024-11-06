import { Component, OnInit } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { WaitingRoomParameters } from '@common/constants';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
    selector: 'app-disconnect-modal',
    standalone: true,
    imports: [],
    templateUrl: './disconnect-modal.component.html',
    styleUrl: './disconnect-modal.component.scss',
})
export class DisconnectModalComponent implements OnInit {
    constructor(private socketService: SocketService, private router: Router) {
        this.socketService = socketService;
        this.router = router;
    }
    isPlayerDisconnected = false;

    socketSubscription: Subscription = new Subscription();

    ngOnInit() {
        this.listenToDisconnect();
    }

    listenToDisconnect() {
        this.socketSubscription.add(
            this.socketService.listen('disconnected').subscribe(() => {
                this.isPlayerDisconnected = true;
                console.log('Player disconnected');
                setTimeout(() => {
                    this.router.navigate(['/']);
                    this.isPlayerDisconnected = false;
                }, WaitingRoomParameters.TIME_LIMIT);
            }),
        );
    }
}
