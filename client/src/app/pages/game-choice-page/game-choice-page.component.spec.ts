import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CommunicationMapService } from '@app/services/communication.map.service';
import { Map, Mode } from '@common/map.types';
import { of } from 'rxjs';
import { GameChoicePageComponent } from './game-choice-page.component';

const mockMaps: Map[] = [
    {
        _id: '1',
        name: 'Map1',
        description: 'Description1',
        imagePreview: 'image1.png',
        mode: Mode.Ctf,
        mapSize: { x: 1, y: 1 },
        startTiles: [],
        items: [],
        doorTiles: [],
        tiles: [],
        lastModified: new Date(),
    },
    {
        _id: '2',
        name: 'Map2',
        description: 'Description2',
        imagePreview: 'image2.png',
        mode: Mode.Normal,
        mapSize: { x: 2, y: 2 },
        startTiles: [],
        items: [],
        doorTiles: [],
        tiles: [],
        lastModified: new Date(),
    },
];

import SpyObj = jasmine.SpyObj;

describe('GameChoicePageComponent', () => {
    let component: GameChoicePageComponent;
    let fixture: ComponentFixture<GameChoicePageComponent>;
    let router: SpyObj<Router>;
    let communicationMapService: SpyObj<CommunicationMapService>;

    beforeEach(async () => {
        router = jasmine.createSpyObj('Router', ['navigate']);
        communicationMapService = jasmine.createSpyObj('CommunicationMapService', ['basicGet']);

        await TestBed.configureTestingModule({
            imports: [GameChoicePageComponent, CommonModule],
            providers: [
                { provide: Router, useValue: router },
                {
                    provide: CommunicationMapService,
                    useValue: communicationMapService,
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameChoicePageComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch all visible maps on init', () => {
        communicationMapService.basicGet.and.returnValue(of(mockMaps));
        component.ngOnInit();
        expect(component.maps).toEqual(mockMaps);
    });

    it('should set selectedMap when selectMap is called', () => {
        const mapId = '1';
        component.selectMap(mapId);
        expect(component.selectedMap).toBe(mapId);
    });

    it('should navigate to create-character on next if map is selected', () => {
        component.selectedMap = 'Map1';
        component.next();

        expect(router.navigate).toHaveBeenCalledWith(['/create-character'], { queryParams: { name: 'Map1' } });
    });

    it('should set userError to true when next is called and no map is selected', () => {
        component.selectedMap = undefined;
        component.next();
        expect(component.showErrorMessage.userError).toBeTrue();
    });

    it('should navigate to main menu when onReturn is called', () => {
        component.onReturn();
        expect(router.navigate).toHaveBeenCalledWith(['/mainmenu']);
    });
});
