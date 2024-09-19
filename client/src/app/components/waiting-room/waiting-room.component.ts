import { Component } from '@angular/core';

@Component({
    selector: 'app-waiting-room',
    standalone: true,
    imports: [],
    templateUrl: './waiting-room.component.html',
    styleUrls: ['./waiting-room.component.scss'],
})
export class WaitingRoomComponent {
    waitingRoomCode: number = 0;

    ngOnInit(): void {
        this.generateRandomNumber();
    }

    generateRandomNumber(): void {
        this.waitingRoomCode = Math.floor(1000 + Math.random() * 9000);
    }
}
