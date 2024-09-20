import { Component, OnInit } from '@angular/core';

const minCode = 1000;
const maxCode = 9000;

@Component({
    selector: 'app-waiting-room',
    standalone: true,
    imports: [],
    templateUrl: './waiting-room.component.html',
    styleUrls: ['./waiting-room.component.scss'],
})
export class WaitingRoomComponent implements OnInit {
    waitingRoomCode: number = 0;

    ngOnInit(): void {
        this.generateRandomNumber();
    }

    generateRandomNumber(): void {
        this.waitingRoomCode = Math.floor(minCode + Math.random() * maxCode);
    }
}
