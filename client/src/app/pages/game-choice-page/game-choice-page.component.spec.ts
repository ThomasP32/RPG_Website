import { CommonModule } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Map, Mode } from '@common/map.types';
import { of } from 'rxjs';
import { GameChoicePageComponent } from './game-choice-page.component';

const mockMaps: Map[] = [
    {
        name: 'Map1',
        description: 'Description1',
        imagePreview: '',
        mode: Mode.Ctf,
        mapSize: { x: 1, y: 1 },
        startTiles: [],
        items: [],
        doorTiles: [],
        tiles: [],
    },
    {
        name: 'Map2',
        description: 'Description2',
        imagePreview: 'image2.png',
        mode: Mode.Classic,
        mapSize: { x: 2, y: 2 },
        startTiles: [],
        items: [],
        doorTiles: [],
        tiles: [],
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
        communicationMapService.basicGet.and.returnValue(of(mockMaps[0]));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch all visible maps on init', async () => {
        communicationMapService.basicGet.and.returnValue(of(mockMaps));
        await component.ngOnInit();
        expect(component.maps).toEqual(mockMaps);
    });

    it('should select a map', () => {
        const mapName = 'Map 1';
        component.selectMap(mapName);
        expect(component.selectedMap).toBe(mapName);
    });

    it('should navigate to create-character on next if map is selected', async () => {
        component.selectedMap = 'Map1';
        await component.next();

        expect(router.navigate).toHaveBeenCalledWith([`create-game/Map1/create-character`]);
    });

    it('should set error message if no map selected', () => {
        component.selectedMap = undefined;
        component.next();
        expect(router.navigate).not.toHaveBeenCalled();
        expect(component.showErrorMessage.userError).toBe(true);
    });

    it('should navigate to mainmenu onReturn', () => {
        component.onReturn();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should set gameChoiceError and navigate to root if chosen map is not found', fakeAsync(async () => {
        component.selectedMap = 'Map1';
        communicationMapService.basicGet.and.returnValue(of(undefined));

        await component.next();

        expect(component.showErrorMessage.gameChoiceError).toBe(true);
        tick(3000);
        expect(router.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should return player count message for given map size', () => {
        const mapSize = 4;
        const playerCountMessage = '4 players';
        spyOn(component['mapConversionService'], 'getPlayerCountMessage').and.returnValue(playerCountMessage);

        const result = component.getMapPlayers(mapSize);

        expect(result).toBe(playerCountMessage);
        expect(component['mapConversionService'].getPlayerCountMessage).toHaveBeenCalledWith(mapSize);
    });
});
