import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MapService } from '@app/services/map.service';
// import { Mode } from '@common/map.types';
import { MapAreaComponent } from '@app/components/map-area/map-area.component';
import { MapControlBarComponent } from '@app/components/map-control-bar/map-control-bar.component';
import { Mode } from '@common/map.types';
import { Subject } from 'rxjs';
import { GameCreationPageComponent } from './game-creation-page.component';

describe('GameCreationPageComponent in creation mode', () => {
    let component: GameCreationPageComponent;
    let fixture: ComponentFixture<GameCreationPageComponent>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let routerSpy: jasmine.SpyObj<Router>;
    let mapAreaComponentSpy: jasmine.SpyObj<MapAreaComponent>;
    let resetMapSubject = new Subject<void>();
    let generateMapSubject = new Subject<void>();
    let mapControlBarComponentSpy: jasmine.SpyObj<MapControlBarComponent>;

    beforeEach(async () => {
        mapServiceSpy = jasmine.createSpyObj('MapService', [
            'resetMap',
            'generateMap',
            'getMap',
            'saveNewMap',
            'updateSelectedTile',
            'createMap',
            'updateMap',
        ]);
        mapServiceSpy.resetMap$ = resetMapSubject.asObservable();
        mapServiceSpy.generateMap$ = generateMapSubject.asObservable();
        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
            snapshot: {
                params: { id: '123', mode: 'classique', size: '10' },
            },
        });

        routerSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '' });
        mapAreaComponentSpy = jasmine.createSpyObj('MapAreaComponent', ['screenMap', 'generateMap', 'resetMapToDefault']);
        mapControlBarComponentSpy = jasmine.createSpyObj('MapControlBarComponent', ['showError']);

        await TestBed.configureTestingModule({
            imports: [GameCreationPageComponent],
            providers: [
                { provide: MapService, useValue: mapServiceSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameCreationPageComponent);
        component = fixture.componentInstance;

        component.mapAreaComponent = mapAreaComponentSpy;
        component.mapControlBarComponent = mapControlBarComponentSpy;
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

    it('should initialize in creation mode', async () => {
        activatedRouteSpy.snapshot.params = { mode: 'mode=classique', size: 'size=10' };
        spyOn(component, 'getUrlParams').and.callThrough();

        await component.ngOnInit();

        expect(component.isCreationPage).toBe(true);
        expect(mapServiceSpy.createMap).toHaveBeenCalledWith(component.mode, component.mapSize);
        expect(mapServiceSpy.getMap).not.toHaveBeenCalled();
        expect(component.getUrlParams).toHaveBeenCalled();
    });

    it('should handle reset map event', () => {
        component.ngOnInit();
        resetMapSubject.next();
        expect(mapAreaComponentSpy.resetMapToDefault).toHaveBeenCalled();
        expect(mapServiceSpy.updateSelectedTile).toHaveBeenCalledWith('empty');
    });

    it('should handle generate map event', async () => {
        mapServiceSpy.saveNewMap.and.returnValue(Promise.resolve('some-error-message'));

        component.ngOnInit();
        generateMapSubject.next();
        await mapServiceSpy.saveNewMap();

        expect(mapAreaComponentSpy.screenMap).toHaveBeenCalled();
        expect(mapAreaComponentSpy.generateMap).toHaveBeenCalled();
        expect(mapServiceSpy.saveNewMap).toHaveBeenCalled();
    });

    it('should get url params', () => {
        activatedRouteSpy.snapshot.params = { id: '1' };
        component.getUrlParams();
        expect(component.mapId).toBe('1');
    });
});

describe('GameCreationPageComponent in edition mode', () => {
    let component: GameCreationPageComponent;
    let fixture: ComponentFixture<GameCreationPageComponent>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let routerSpy: jasmine.SpyObj<Router>;
    let mapAreaComponentSpy: jasmine.SpyObj<MapAreaComponent>;
    let resetMapSubject = new Subject<void>();
    let generateMapSubject = new Subject<void>();
    let mapControlBarComponentSpy: jasmine.SpyObj<MapControlBarComponent>;

    beforeEach(async () => {
        mapServiceSpy = jasmine.createSpyObj('MapService', [
            'resetMap',
            'generateMap',
            'getMap',
            'saveNewMap',
            'updateSelectedTile',
            'createMap',
            'updateMap',
        ]);
        mapServiceSpy.resetMap$ = resetMapSubject.asObservable();
        mapServiceSpy.generateMap$ = generateMapSubject.asObservable();
        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
            snapshot: {
                params: { id: '1' },
            },
        });

        routerSpy = jasmine.createSpyObj('Router', ['navigate'], { url: 'edition' });
        mapAreaComponentSpy = jasmine.createSpyObj('MapAreaComponent', ['screenMap', 'generateMap', 'resetMapToDefault']);
        mapControlBarComponentSpy = jasmine.createSpyObj('MapControlBarComponent', ['showError']);

        await TestBed.configureTestingModule({
            imports: [GameCreationPageComponent],
            providers: [
                { provide: MapService, useValue: mapServiceSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameCreationPageComponent);
        component = fixture.componentInstance;

        component.mapAreaComponent = mapAreaComponentSpy;
        component.mapControlBarComponent = mapControlBarComponentSpy;

    });

    afterEach(() => {
        mapServiceSpy.resetMap.calls.reset();
        mapServiceSpy.saveNewMap.calls.reset();
        mapServiceSpy.updateSelectedTile.calls.reset();
        mapServiceSpy.updateMap.calls.reset();
    });

    it('should initialize in edition mode', async () => {
        const mockMap = {
            name: 'Test Map',
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
            description: '',
            mode: Mode.Classic,
            imagePreview: '',
        };
        mapServiceSpy.map = mockMap;
        mapServiceSpy.getMap.and.returnValue(Promise.resolve());

        await component.ngOnInit();

        expect(mapServiceSpy.getMap).toHaveBeenCalledWith('1');
        expect(component.map).toEqual(mockMap);
        expect(component.isCreationPage).toBe(false);
    });

    it('should handle generate map event', async () => {
        mapServiceSpy.updateMap.and.returnValue(Promise.resolve('some-error-message'));

        await component.ngOnInit();

        generateMapSubject.next();
        
        await fixture.whenStable();

        expect(mapAreaComponentSpy.screenMap).toHaveBeenCalled();
        expect(mapAreaComponentSpy.generateMap).toHaveBeenCalled();
        expect(mapServiceSpy.updateMap).toHaveBeenCalledWith('1');

    });
});
