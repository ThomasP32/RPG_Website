import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommunicationMapService } from '@app/services/communication.map.service';
import { Map } from '@common/map.types';

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: 'game-choice-page',
    standalone: true,
    templateUrl: './game-choice-page.component.html',
    styleUrls: ['./game-choice-page.component.scss'],
    imports: [CommonModule, RouterLink],
})
export class GameChoicePageComponent implements OnInit {
    map: Map;
    maps: Map[] = [];
    selectedMap: string | undefined = undefined;
    showErrorMessage: { userError: boolean } = {
        userError: false,
    };

    private readonly router: Router = inject(Router);

    constructor(private communicationMapService: CommunicationMapService) {}

    ngOnInit(): void {
        this.communicationMapService.basicGet<Map[]>('map').subscribe((maps) => (this.maps = maps));
    }

    selectMap(mapName: string) {
        this.selectedMap = mapName;
    }

    next() {
        if (this.selectedMap) {
            this.router.navigate(['/create-character'], { queryParams: { name: this.selectedMap } });
        } else {
            this.showErrorMessage.userError = true;
        }
    }

    onReturn() {
        this.router.navigate(['/mainmenu']);
    }
}
