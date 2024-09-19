import { Component } from '@angular/core';
import { WaitingRoomComponent } from '@app/components/waiting-room/waiting-room.component';

@Component({
    selector: 'app-waiting-room-page',
    standalone: true,
    imports: [WaitingRoomComponent],
    templateUrl: './waiting-room-page.component.html',
    styleUrls: ['./waiting-room-page.component.scss'],
})
export class WaitingRoomPageComponent {}
