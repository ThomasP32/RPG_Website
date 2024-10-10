import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ImageService } from '@app/services/image.service';
import { MapCounterService } from '@app/services/map-counter.service';
import { MapService } from '@app/services/map.service';
import { ScreenShotService } from '@app/services/screenshot/screenshot.service';
import { TileService } from '@app/services/tile.service';
import { ItemCategory, DBMap as Map, Mode, TileCategory } from '@common/map.types';
import { of } from 'rxjs';
import { MapAreaComponent } from './map-area.component';

describe('MapAreaComponent', () => {
    let component: MapAreaComponent;
    let fixture: ComponentFixture<MapAreaComponent>;

    let tileServiceSpy: jasmine.SpyObj<TileService>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let mapCounterServiceSpy: jasmine.SpyObj<MapCounterService>;
    let imageServiceSpy: jasmine.SpyObj<ImageService>;
    let screenshotServiceSpy: jasmine.SpyObj<ScreenShotService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        tileServiceSpy = jasmine.createSpyObj('TileService', ['placeTile', 'eraseTile', 'moveItem', 'setItem']);
        mapServiceSpy = jasmine.createSpyObj('MapService', ['updateSelectedTile$', 'map']);
        mapCounterServiceSpy = jasmine.createSpyObj('MapCounterService', ['startingPointCounter$', 'updateCounters', 'updateStartingPointCounter']);
        imageServiceSpy = jasmine.createSpyObj('ImageService', ['getTileImage', 'getItemImage']);
        screenshotServiceSpy = jasmine.createSpyObj('ScreenShotService', ['captureAndUpload']);
        routerSpy = jasmine.createSpyObj('Router', ['url']);

        mapServiceSpy.map = {
            name: 'Test Map',
            description: 'This is a test map',
            mode: Mode.Classic,
            imagePreview: '',
            mapSize: { x: 10, y: 10 },
            tiles: [],
            doorTiles: [],
            items: [],
            startTiles: [],
        };

        await TestBed.configureTestingModule({
            imports: [MapAreaComponent],
            providers: [
                { provide: TileService, useValue: tileServiceSpy },
                { provide: MapService, useValue: mapServiceSpy },
                { provide: MapCounterService, useValue: mapCounterServiceSpy },
                { provide: ImageService, useValue: imageServiceSpy },
                { provide: ScreenShotService, useValue: screenshotServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: { snapshot: { params: { mode: 'classic' } } } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MapAreaComponent);
        component = fixture.componentInstance;

        mapCounterServiceSpy.startingPointCounter$ = of(0);
        mapServiceSpy.updateSelectedTile$ = of('floor');
        Object.defineProperty(routerSpy, 'url', { get: () => '/creation' });

        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize map in creation mode', () => {
        spyOn(component, 'initializeCreationMode');
        component.initMap();
        expect(component.initializeCreationMode).toHaveBeenCalled();
    });

    it('should initialize creation mode', () => {
        spyOn(component, 'createMap');
        spyOn(component, 'setCountersBasedOnMapSize');
        component.initializeCreationMode();
        expect(component.createMap).toHaveBeenCalledWith(mapServiceSpy.map.mapSize.x);
        expect(component.setCountersBasedOnMapSize).toHaveBeenCalledWith(mapServiceSpy.map.mapSize.x);
    });

    it('should set counters based on map size', () => {
        mapCounterServiceSpy.updateStartingPointCounter.calls.reset();
        spyOn(mapCounterServiceSpy, 'updateStartingPointCounter');
        component.setCountersBasedOnMapSize(10);
        expect(component.randomItemCounter).toBe(2);
        expect(component.startingPointCounter).toBe(2);
        expect(component.itemsCounter).toBe(10);
        expect(mapCounterServiceSpy.updateStartingPointCounter).toHaveBeenCalledWith(2);
    });

    it('should return correct counters for map size', () => {
        const countersFor10 = component.getCountersForMapSize(10);
        expect(countersFor10).toEqual({ randomItemCounter: 2, startingPointCounter: 2, itemsCounter: 10 });

        const countersFor15 = component.getCountersForMapSize(15);
        expect(countersFor15).toEqual({ randomItemCounter: 4, startingPointCounter: 4, itemsCounter: 14 });

        const countersForUnknown = component.getCountersForMapSize(25);
        expect(countersForUnknown).toEqual({ randomItemCounter: 0, startingPointCounter: 0, itemsCounter: 0 });
    });

    it('should select a tile', () => {
        const tile = 'wall';
        component.selectTile(tile);
        expect(component.selectedTile).toBe(tile);
    });

    it('should start placing tile', () => {
        const rowIndex = 0;
        const colIndex = 0;
        component.startPlacingTile(rowIndex, colIndex);
        expect(tileServiceSpy.placeTile).toHaveBeenCalledWith(component.Map, rowIndex, colIndex, component.selectedTile);
    });

    it('should stop placing tile on mouse up', () => {
        component.isMouseDown = true;
        component.stopPlacing();
        expect(component.isMouseDown).toBe(false);
        expect(component.isPlacing).toBe(false);
    });

    it('should capture a screenshot and set image preview', async () => {
        screenshotServiceSpy.captureAndUpload.and.returnValue(Promise.resolve('test-image-url'));
        await component.screenMap();
        expect(screenshotServiceSpy.captureAndUpload).toHaveBeenCalledWith('screenshot-container');
        expect(mapServiceSpy.map.imagePreview).toBe('test-image-url');
    });

    it('should reset the map to default', () => {
        component.Map = [[{ value: 'wall', isHovered: false }]];
        component.resetMapToDefault();
        expect(component.Map[0][0].value).toBe(component.defaultTile);
    });

    it('should place tile on mouse move when mouse is down', () => {
        component.isMouseDown = true;
        const rowIndex = 0;
        const colIndex = 0;
        component.placeTileOnMove(rowIndex, colIndex);
        expect(tileServiceSpy.placeTile).toHaveBeenCalledWith(component.Map, rowIndex, colIndex, component.selectedTile);
    });

    it('should initialize the map service map based on the loaded map', () => {
        const mockMap: Map = {
            _id: '1',
            name: 'Test Map',
            isVisible: true,
            mapSize: { x: 1, y: 1 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [{ coordinate: { x: 0, y: 0 }, category: TileCategory.Wall }],
            mode: Mode.Ctf,
            lastModified: new Date(),
            description: '',
            imagePreview: '',
        };
        mapServiceSpy.map = mockMap;
        component.loadMap(mockMap);
        expect(component.Map[0][0].value).toBe('wall');
    });

    it('should generate map', () => {
        spyOn(component, 'generateMap');
        component.generateMap();
        expect(component.generateMap).toHaveBeenCalled();
    });

    it('should load map correctly', () => {
        const mockMap: Map = {
            _id: '1',
            name: 'Test Map',
            mapSize: { x: 2, y: 2 },
            tiles: [{ coordinate: { x: 0, y: 0 }, category: TileCategory.Wall }],
            doorTiles: [{ coordinate: { x: 1, y: 1 }, isOpened: true }],
            startTiles: [{ coordinate: { x: 0, y: 1 } }],
            items: [{ coordinate: { x: 1, y: 0 }, category: ItemCategory.Hat }],
            mode: Mode.Classic,
            lastModified: new Date(),
            description: '',
            imagePreview: '',
            isVisible: true,
        };
        component.loadMap(mockMap);
        expect(component.Map[0][0].value).toBe('wall');
        expect(component.Map[1][1].value).toBe('door');
        expect(component.Map[1][1].doorState).toBe('open');
        expect(component.Map[1][0].item).toBe('hat');
        expect(component.Map[0][1].item).toBe('starting-point');
    });

    it('should call tile service to move item on drop', () => {
        const event = new DragEvent('drop');

        spyOn(event, 'preventDefault');
        Object.defineProperty(event, 'dataTransfer', {
            value: {
                getData: jasmine.createSpy('getData').and.returnValue('starting-point'),
            },
        });

        component.currentDraggedItem = { rowIndex: 0, colIndex: 0 };

        component.onDrop(event, 1, 1);

        expect(tileServiceSpy.moveItem).toHaveBeenCalledWith(component.Map, { rowIndex: 0, colIndex: 0 }, { rowIndex: 1, colIndex: 1 });

        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle drag start only if there is an item', () => {
        const event = new DragEvent('dragstart');
        const cell = { value: 'floor', isHovered: false, item: 'some-item' };
        component.Map[0] = [cell];
        component.startDrag(event, 0, 0);
        expect(component.currentDraggedItem).toEqual({ rowIndex: 0, colIndex: 0 });
    });

    it('should prevent default when dragging an image inside a grid item', () => {
        const event = new DragEvent('dragstart');
        const targetElement = document.createElement('img');
        const tileElement = document.createElement('div');
        tileElement.classList.add('grid-item');
        tileElement.appendChild(targetElement);

        spyOn(event, 'preventDefault');
        spyOnProperty(event, 'target', 'get').and.returnValue(targetElement);
        spyOn(targetElement, 'closest').and.returnValue(tileElement);

        component.onDragStart(event);

        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not prevent default when dragging an image outside a grid item', () => {
        const event = new DragEvent('dragstart');
        const targetElement = document.createElement('img');

        spyOn(event, 'preventDefault');
        spyOnProperty(event, 'target', 'get').and.returnValue(targetElement);
        spyOn(targetElement, 'closest').and.returnValue(null);

        component.onDragStart(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not prevent default when dragging an element other than an image', () => {
        const event = new DragEvent('dragstart');
        const targetElement = document.createElement('div');

        spyOn(event, 'preventDefault');
        spyOnProperty(event, 'target', 'get').and.returnValue(targetElement);

        component.onDragStart(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
    });
});
