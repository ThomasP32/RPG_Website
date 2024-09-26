import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Routes, provideRouter } from '@angular/router';
import { CommunicationMapService } from '@app/services/communication.map.service';
import { Map } from '@common/map.types';
import { of } from 'rxjs';
import { StartGamePageComponent } from './start-game-page.component';

import SpyObj = jasmine.SpyObj;

const routes: Routes = [];

describe('StartGamePageComponent', () => {
    let component: StartGamePageComponent;
    let fixture: ComponentFixture<StartGamePageComponent>;
    let communicationMapServiceSpy: SpyObj<CommunicationMapService>;
    let mockMaps: Map[];

    beforeEach(async () => {
        communicationMapServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['getMapsFromServer', 'maps$']);

        communicationMapServiceSpy.maps$ = of(mockMaps);

        mockMaps = [
            { _id: '1', name: 'Map 1', isVisible: true, mapSize: { x: 10, y: 10 }, startTiles: [], items: [], doorTiles: [], tiles: [] },
            { _id: '2', name: 'Map 2', isVisible: false, mapSize: { x: 10, y: 10 }, startTiles: [], items: [], doorTiles: [], tiles: [] },
        ];

        await TestBed.configureTestingModule({
            imports: [StartGamePageComponent],
            providers: [
                {
                    provide: CommunicationMapService,
                    useValue: communicationMapServiceSpy,
                },
                provideRouter(routes),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        const fixture = TestBed.createComponent(StartGamePageComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });
});
