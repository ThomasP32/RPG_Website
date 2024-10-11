import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MapService } from '@app/services/map.service';
import { DBMap as Map, Mode } from '@common/map.types';
import { Subject } from 'rxjs';
import { GameCreationPageComponent } from './game-creation-page.component';

describe('GameCreationPageComponent', () => {
    let component: GameCreationPageComponent;
    let fixture: ComponentFixture<GameCreationPageComponent>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
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
        mapServiceSpy = jasmine.createSpyObj('MapService', ['resetMap', 'saveNewMap', 'updateSelectedTile', 'createMap', 'updateMap'], {
            resetMap$: new Subject<void>(),
            generateMap$: new Subject<void>(),
        });

        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', ['snapshot']);

        await TestBed.configureTestingModule({
            imports: [GameCreationPageComponent],
            providers: [
                { provide: MapService, useValue: mapServiceSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameCreationPageComponent);
        component = fixture.componentInstance;
    });
    afterEach(() => {
        mapServiceSpy.resetMap.calls.reset();
        mapServiceSpy.saveNewMap.calls.reset();
        mapServiceSpy.updateSelectedTile.calls.reset();
        mapServiceSpy.updateMap.calls.reset();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize in creation mode', () => {
        activatedRouteSpy.snapshot.params = { mode: 'classic', size: '10' };
        component.ngOnInit();
        expect(component.isCreationPage).toBe(true);
        expect(mapServiceSpy.getMap).not.toHaveBeenCalled();
    });

    it('should initialize in edition mode', async () => {
        activatedRouteSpy.snapshot.params = { id: '1' };
        mapServiceSpy.map = mockMap;
        const getMapPromise = Promise.resolve();
        mapServiceSpy.getMap.and.returnValue(getMapPromise);

        await component.ngOnInit();

        expect(component.getUrlParams).toHaveBeenCalled();
        expect(mapServiceSpy.getMap).toHaveBeenCalledWith('1');
        expect(component.map).toEqual(mockMap);
        expect(component.isCreationPage).toBe(false);
    });

    it('should handle reset map event', () => {
        const mapAreaComponent = jasmine.createSpyObj('MapAreaComponent', ['resetMapToDefault']);
        component.mapAreaComponent = mapAreaComponent;

        spyOn(mapServiceSpy.resetMap$, 'subscribe').and.callThrough();
        spyOn(mapAreaComponent, 'resetMapToDefault');

        component.ngOnInit();
        (mapServiceSpy.resetMap$ as Subject<void>).next();

        expect(mapAreaComponent.resetMapToDefault).toHaveBeenCalled();
        expect(mapServiceSpy.updateSelectedTile).toHaveBeenCalledWith('empty');
    });

    it('should handle generate map event', async () => {
        const mapAreaComponent = jasmine.createSpyObj('MapAreaComponent', ['screenMap', 'generateMap']);
        component.mapAreaComponent = mapAreaComponent;

        spyOn(mapServiceSpy.generateMap$, 'subscribe').and.callThrough();
        spyOn(mapServiceSpy, 'saveNewMap').and.returnValue(Promise.resolve('some-error-message'));
        spyOn(mapAreaComponent, 'screenMap');
        spyOn(mapAreaComponent, 'generateMap');

        component.ngOnInit();

        (mapServiceSpy.generateMap$ as Subject<void>).next();
        await mapServiceSpy.saveNewMap();

        expect(mapAreaComponent.screenMap).toHaveBeenCalled();
        expect(mapAreaComponent.generateMap).toHaveBeenCalled();
        expect(mapServiceSpy.saveNewMap).toHaveBeenCalled();
    });

    it('should handle generate map event in edition mode', async () => {
        const mapAreaComponent = jasmine.createSpyObj('MapAreaComponent', ['screenMap', 'generateMap']);
        component.mapAreaComponent = mapAreaComponent;

        spyOn(mapServiceSpy, 'updateMap').and.returnValue(Promise.resolve('some-error-message'));
        spyOn(mapAreaComponent, 'screenMap');
        spyOn(mapAreaComponent, 'generateMap');

        component.ngOnInit();

        (mapServiceSpy.generateMap$ as Subject<void>).next();
        await mapServiceSpy.updateMap('1');

        expect(mapAreaComponent.screenMap).toHaveBeenCalled();
        expect(mapAreaComponent.generateMap).toHaveBeenCalled();
        expect(mapServiceSpy.updateMap).toHaveBeenCalledWith('1');
    });

    it('should get url params', () => {
        activatedRouteSpy.snapshot.params = { id: '1' };
        component.getUrlParams();
        expect(component.mapId).toBe('1');
    });
});
