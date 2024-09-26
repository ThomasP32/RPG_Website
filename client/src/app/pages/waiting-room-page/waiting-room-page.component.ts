import { Component, OnInit } from '@angular/core';
import { WaitingRoomComponent } from '@app/components/waiting-room/waiting-room.component';

const minCode = 1000;
const maxCode = 9999;
@Component({
    selector: 'app-waiting-room-page',
    standalone: true,
    imports: [WaitingRoomComponent],
    templateUrl: './waiting-room-page.component.html',
    styleUrls: ['./waiting-room-page.component.scss'],
})
export class WaitingRoomPageComponent implements OnInit {
    waitingRoomCode: number = 0;

    ngOnInit(): void {
        this.generateRandomNumber();
    }

    generateRandomNumber(): void {
        this.waitingRoomCode = Math.floor(minCode + Math.random() * maxCode);
    }
}
