import { Component, OnInit } from '@angular/core';
import { CommunicationMapService } from '@app/services/communication.map.service';
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
    constructor(readonly communicationMapService: CommunicationMapService) {
        this.communicationMapService.maps$.subscribe((maps) => (this.maps = maps));
    }

    ngOnInit(): void {
    }
}
