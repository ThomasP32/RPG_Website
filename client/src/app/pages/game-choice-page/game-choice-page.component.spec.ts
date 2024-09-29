import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CommunicationMapService } from '@app/services/communication.map.service';
import { Map, Mode } from '@common/map.types';
import { of } from 'rxjs';
import { GameChoicePageComponent } from './game-choice-page.component';

describe('GameChoicePageComponent', () => {
    let component: GameChoicePageComponent;
    let fixture: ComponentFixture<GameChoicePageComponent>;
    let communicationMapServiceSpy: jasmine.SpyObj<CommunicationMapService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        communicationMapServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['basicGet']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [GameChoicePageComponent], // Import the component
            providers: [
                { provide: CommunicationMapService, useValue: communicationMapServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameChoicePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load maps on init', () => {
        const mockMaps: Map[] = [
            {
                name: 'Map 1',
                mapSize: { x: 10, y: 10 },
                mode: Mode.Classic,
                isVisible: true,
                _id: '1',
                items: [],
                doorTiles: [],
                startTiles: [],
                tiles: [],
                description: '',
                imagePreview: '',
            },
            {
                name: 'Map 2',
                mapSize: { x: 20, y: 20 },
                mode: Mode.Ctf,
                isVisible: false,
                _id: '2',
                items: [],
                doorTiles: [],
                startTiles: [],
                tiles: [],
                description: '',
                imagePreview: '',
            },
        ];
        communicationMapServiceSpy.basicGet.and.returnValue(of(mockMaps));

        component.ngOnInit();

        expect(communicationMapServiceSpy.basicGet).toHaveBeenCalledWith('map');
        expect(component.maps).toEqual(mockMaps);
    });

    it('should select a map', () => {
        const mapName = 'Map 1';
        component.selectMap(mapName);
        expect(component.selectedMap).toBe(mapName);
    });

    it('should navigate to create character with selected map', () => {
        component.selectedMap = 'Selected Map';
        component.next();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/create-character'], { queryParams: { name: 'Selected Map' } });
        expect(component.showErrorMessage.userError).toBe(false);
    });

    it('should set error message if no map selected', () => {
        component.selectedMap = undefined;
        component.next();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
        expect(component.showErrorMessage.userError).toBe(true);
    });

    it('should navigate to mainmenu onReturn', () => {
        component.onReturn();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/mainmenu']);
    });
});
