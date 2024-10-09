import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MapGetService } from '@app/services/map-get.service';
import { MapService } from '@app/services/map.service';
import { DBMap as Map, Mode } from '@common/map.types';
import { Subject } from 'rxjs';
import { GameCreationPageComponent } from './game-creation-page.component';

describe('GameCreationPageComponent', () => {
    let component: GameCreationPageComponent;
    let fixture: ComponentFixture<GameCreationPageComponent>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let mapGetServiceSpy: jasmine.SpyObj<MapGetService>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;

    const mockMap: Map = {
        _id: '1',
        name: 'Test Map',
        isVisible: true,
        mapSize: { x: 10, y: 10 },
        startTiles: [],
        items: [],
        doorTiles: [],
        tiles: [],
        description: '',
        mode: Mode.Classic,
        imagePreview: '',
        lastModified: new Date(),
    };

    beforeEach(async () => {
        mapServiceSpy = jasmine.createSpyObj('MapService', ['resetMap', 'saveNewMap'], { resetMap$: new Subject<void>() });
        mapGetServiceSpy = jasmine.createSpyObj('MapGetService', ['getMap', 'map']);
        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', ['snapshot']);

        await TestBed.configureTestingModule({
            imports: [GameCreationPageComponent],
            providers: [
                { provide: MapService, useValue: mapServiceSpy },
                { provide: MapGetService, useValue: mapGetServiceSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameCreationPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize in creation mode', () => {
        activatedRouteSpy.snapshot.params = {};

        component.ngOnInit();

        expect(component.isCreationPage).toBe(true);
        expect(mapServiceSpy.getMap).not.toHaveBeenCalled();
    });

    it('should initialize in edition mode', async () => {
        activatedRouteSpy.snapshot.params = { id: '1' };
        mapGetServiceSpy.map = mockMap;
        const getMapPromise = Promise.resolve();
        mapGetServiceSpy.getMap.and.returnValue(getMapPromise);

        await component.ngOnInit();

        expect(component.getUrlParams).toHaveBeenCalled();
        expect(mapGetServiceSpy.getMap).toHaveBeenCalledWith('1');
        expect(component.map).toEqual(mockMap);
        expect(component.isCreationPage).toBe(false);
    });

    it('should handle reset map event', () => {
        const mapAreaComponent = jasmine.createSpyObj('MapAreaComponent', ['resetMapToDefault']);
        component.mapAreaComponent = mapAreaComponent;
        spyOn(mapServiceSpy.resetMap$, 'subscribe').and.callThrough();
        spyOn(mapServiceSpy, 'updateSelectedTile').and.callThrough();
        spyOn(mapAreaComponent, 'resetMapToDefault');

        component.ngOnInit();

        (mapServiceSpy.resetMap$ as Subject<void>).next();

        expect(mapAreaComponent.resetMapToDefault).toHaveBeenCalled();
        expect(mapServiceSpy.updateSelectedTile).toHaveBeenCalledWith('empty');
    });

    it('should get url params', () => {
        const mockId = '1';
        activatedRouteSpy.snapshot.queryParams = { id: mockId };

        component.getUrlParams();

        expect(component.mapId).toBe(mockId);
    });
});
