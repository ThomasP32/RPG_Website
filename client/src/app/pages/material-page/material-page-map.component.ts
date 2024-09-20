import { Component, OnInit } from '@angular/core';
import { CommunicationService } from '@app/services/communication.map.service';
import { Map } from '@common/map.types';

@Component({
    selector: 'app-material-page',
    standalone: true,
    templateUrl: './material-page-map.component.html',
    styleUrls: ['./material-page.component.scss'],
    imports: [],
})
export class MaterialPageMapsComponent implements OnInit {
    maps: Map[] = [];
    constructor(readonly communicationService: CommunicationService) {
        this.communicationService.maps$.subscribe((maps) => (this.maps = maps));
    }

    ngOnInit(): void {
        this.communicationService.getMapsFromServer();
    }
}
