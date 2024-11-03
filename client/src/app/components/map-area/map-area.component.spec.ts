import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ImageService } from '@app/services/image/image.service';
import { MapCounterService } from '@app/services/map-counter/map-counter.service';
import { MapService } from '@app/services/map/map.service';
import { ScreenShotService } from '@app/services/screenshot/screenshot.service';
import { TileService } from '@app/services/tile/tile.service';
import { ItemCategory, DetailedMap, Mode, TileCategory } from '@common/map.types';
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
        screenshotServiceSpy = jasmine.createSpyObj('ScreenShotService', ['captureAndConvert']);
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

    describe('Map Initialization', () => {
        it('should create the component', () => {
            expect(component).toBeTruthy();
        });

        it('should initialize map in creation mode', () => {
            spyOn(component, 'initializeCreationMode');
            component.initMap();
            expect(component.initializeCreationMode).toHaveBeenCalled();
        });

        it('should initialize map in edition mode', () => {
            spyOn(component, 'initializeEditionMode');
            spyOn(component, 'isEditionMode').and.returnValue(true);
            spyOn(component, 'isCreationMode').and.returnValue(false);

            component.initMap();

            expect(component.initializeEditionMode).toHaveBeenCalled();
        });

        it('should ', () => {
            Object.defineProperty(routerSpy, 'url', { get: () => '/edition' });
            component.initMap();
            expect(component.isEditionMode()).toBeTrue();
        });

        it('should initialize edition mode correctly', () => {
            const mapSize = 10;
            const startTilesLength = 3;
            spyOn(component, 'setCountersBasedOnMapSize');
            spyOn(component, 'loadMap');

            mapServiceSpy.map = {
                name: 'Test Map',
                description: 'This is a test map',
                mode: Mode.Classic,
                imagePreview: '',
                mapSize: { x: mapSize, y: mapSize },
                tiles: [],
                doorTiles: [],
                items: [],
                startTiles: new Array(startTilesLength),
            };
            component.startingPointCounter = 5;

            component.initializeEditionMode();

            expect(component.setCountersBasedOnMapSize).toHaveBeenCalledWith(mapSize);
            expect(component.startingPointCounter).toBe(5 - startTilesLength);
            expect(mapCounterServiceSpy.updateStartingPointCounter).toHaveBeenCalledWith(5 - startTilesLength);
            expect(component.loadMap).toHaveBeenCalledWith(mapServiceSpy.map);
        });

        it('should initialize creation mode correctly', () => {
            spyOn(component, 'createMap');
            spyOn(component, 'setCountersBasedOnMapSize');
            component.initializeCreationMode();
            expect(component.createMap).toHaveBeenCalledWith(mapServiceSpy.map.mapSize.x);
            expect(component.setCountersBasedOnMapSize).toHaveBeenCalledWith(mapServiceSpy.map.mapSize.x);
        });
    });

    describe('Map management', () => {
        it('should reset the map to default tile when mode is truthy', () => {
            component.route.snapshot.params['mode'] = 'creation';
            component.Map = [
                [
                    { value: 'wall', isHovered: false },
                    { value: 'door', isHovered: false },
                ],
            ];
            component.resetMapToDefault();

            expect(component.Map[0][0].value).toBe(component.defaultTile);
            expect(component.Map[0][1].value).toBe(component.defaultTile);

            expect(component.Map[0][0].item).toBeUndefined();
            expect(component.Map[0][1].item).toBeUndefined();
        });

        it('should load the map from mapService when mode is falsy', () => {
            component.route.snapshot.params['mode'] = null;
            spyOn(component, 'loadMap');
            component.resetMapToDefault();
            expect(component.loadMap).toHaveBeenCalledWith(mapServiceSpy.map);
        });

        it('should load map correctly', () => {
            const mockMap: DetailedMap = {
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

        it('should initialize the map service map based on the loaded map', () => {
            const mockMap: DetailedMap = {
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

        it('should correctly generate map with tiles, doors, items, and starting points', () => {
            component.Map = [
                [
                    { value: 'wall', isHovered: false },
                    { value: 'door', isHovered: false, doorState: 'open' },
                ],
                [
                    { value: 'floor', isHovered: false, item: 'vest' },
                    { value: 'floor', isHovered: false, item: 'starting-point' },
                ],
            ];

            component.generateMap();

            expect(mapServiceSpy.map.doorTiles).toEqual([{ coordinate: { x: 0, y: 1 }, isOpened: true }]);

            expect(mapServiceSpy.map.tiles).toEqual([{ coordinate: { x: 0, y: 0 }, category: TileCategory.Wall }]);

            expect(mapServiceSpy.map.items).toEqual([{ coordinate: { x: 1, y: 0 }, category: ItemCategory.Vest }]);

            expect(mapServiceSpy.map.startTiles).toEqual([{ coordinate: { x: 1, y: 1 } }]);
        });
    });

    describe('isEditionMode', () => {
        it('should return true when router URL includes "edition"', () => {
            Object.defineProperty(routerSpy, 'url', { get: () => '/map/edition' });
            component.initMap();
            expect(component.isEditionMode()).toBeTrue();
        });

        it('should return false when router URL does not include "edition"', () => {
            Object.defineProperty(routerSpy, 'url', { get: () => '/map/creation' });
            component.initMap();
            expect(component.isEditionMode()).toBeFalse();
        });

        it('should return false when router URL is different', () => {
            Object.defineProperty(routerSpy, 'url', { get: () => '/map/tile' });
            component.initMap();
            expect(component.isEditionMode()).toBeFalse();
        });
    });

    describe('Image handling', () => {
        it('should call getItemImage with the correct item', () => {
            const item = 'hat';
            component.Map = [[{ value: 'floor', isHovered: false, item: item }]];

            spyOn(component, 'getItemImage').and.callThrough();
            const result = component.getItemImage(item);
            expect(component.getItemImage).toHaveBeenCalledWith(item);
            expect(result).toBe(imageServiceSpy.getItemImage(item));
        });

        it('should prevent default when dragging an image outside a grid-item', () => {
            const event = new DragEvent('dragstart');
            const targetElement = document.createElement('img');

            spyOn(event, 'preventDefault');
            spyOnProperty(event, 'target', 'get').and.returnValue(targetElement);
            spyOn(targetElement, 'closest').and.returnValue(null);

            component.onDragStart(event);

            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should not prevent default when dragging an image inside a grid-item', () => {
            const event = new DragEvent('dragstart');
            const targetElement = document.createElement('img');
            const gridItemElement = document.createElement('div');
            gridItemElement.classList.add('grid-item');
            gridItemElement.appendChild(targetElement);

            spyOn(event, 'preventDefault');
            spyOnProperty(event, 'target', 'get').and.returnValue(targetElement);
            spyOn(targetElement, 'closest').and.returnValue(gridItemElement);

            component.onDragStart(event);

            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it('should not prevent default when dragging a non-image element', () => {
            const event = new DragEvent('dragstart');
            const targetElement = document.createElement('div');

            spyOn(event, 'preventDefault');
            spyOnProperty(event, 'target', 'get').and.returnValue(targetElement);

            component.onDragStart(event);

            expect(event.preventDefault).not.toHaveBeenCalled();
        });
    });

    describe('Map interactions', () => {
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

        it('should place tile on mouse move when mouse is down', () => {
            component.isMouseDown = true;
            const rowIndex = 0;
            const colIndex = 0;
            component.placeTileOnMove(rowIndex, colIndex);
            expect(tileServiceSpy.placeTile).toHaveBeenCalledWith(component.Map, rowIndex, colIndex, component.selectedTile);
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

            expect(component.currentDraggedItem).toBeNull();
            expect(event.preventDefault).toHaveBeenCalled();
            expect(tileServiceSpy.moveItem).toHaveBeenCalledWith(component.Map, { rowIndex: 0, colIndex: 0 }, { rowIndex: 1, colIndex: 1 });
        });

        it('should call tile service to set item on drop', () => {
            const event = new DragEvent('drop');

            Object.defineProperty(event, 'dataTransfer', {
                value: {
                    getData: jasmine.createSpy('getData').and.returnValue('starting-point'),
                },
            });

            component.currentDraggedItem = null;

            component.onDrop(event, 1, 1);
            expect(tileServiceSpy.setItem).toHaveBeenCalledWith(component.Map, 'starting-point', { rowIndex: 1, colIndex: 1 });
        });

        it('should set currentDraggedItem and add item to dataTransfer on startDrag', () => {
            const event = new DragEvent('dragstart');
            Object.defineProperty(event, 'dataTransfer', {
                value: {
                    setData: jasmine.createSpy('setData'),
                },
            });
            const rowIndex = 0;
            const colIndex = 0;
            component.Map = [[{ value: 'floor', isHovered: false, item: 'test-item' }]];

            component.startDrag(event, rowIndex, colIndex);

            expect(component.currentDraggedItem).toEqual({ rowIndex, colIndex });
            expect(event.dataTransfer?.setData).toHaveBeenCalledWith('item', 'test-item');
        });

        it('should prevent default if no item is present on startDrag', () => {
            const event = new DragEvent('dragstart');
            spyOn(event, 'preventDefault');
            const rowIndex = 0;
            const colIndex = 0;
            component.Map = [[{ value: 'floor', isHovered: false }]];

            component.startDrag(event, rowIndex, colIndex);

            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should call preventDefault on allowDrop', () => {
            const event = new DragEvent('dragover');
            spyOn(event, 'preventDefault');

            component.allowDrop(event);

            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should handle drag start only if there is an item', () => {
            const event = new DragEvent('dragstart');
            const cell = { value: 'floor', isHovered: false, item: 'some-item' };
            component.Map[0] = [cell];
            component.startDrag(event, 0, 0);
            expect(component.currentDraggedItem).toEqual({ rowIndex: 0, colIndex: 0 });
        });

        it('should not prevent default when dragging an element other than an image', () => {
            const event = new DragEvent('dragstart');
            const targetElement = document.createElement('div');

            spyOn(event, 'preventDefault');
            spyOnProperty(event, 'target', 'get').and.returnValue(targetElement);

            component.onDragStart(event);

            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it('should call eraseTile when isMouseDown and isRightClickDown are true', () => {
            component.isMouseDown = true;
            component.isRightClickDown = true;

            const rowIndex = 0;
            const colIndex = 0;

            component.placeTileOnMove(rowIndex, colIndex);

            expect(tileServiceSpy.eraseTile).toHaveBeenCalledWith(component.Map, rowIndex, colIndex, component.defaultTile);
            expect(tileServiceSpy.placeTile).not.toHaveBeenCalled();
        });
    });

    describe('Map counters', () => {
        it('should set counters based on map size', () => {
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

        it('should call eraseTile when right-clicking to place a tile', () => {
            const rowIndex = 1;
            const colIndex = 1;
            component.startPlacingTile(rowIndex, colIndex, true);

            expect(tileServiceSpy.eraseTile).toHaveBeenCalledWith(component.Map, rowIndex, colIndex, component.defaultTile);
            expect(component.isRightClickDown).toBeTrue();
        });

        it('should call stopPlacing when mouse up event is triggered', () => {
            const event = new MouseEvent('mouseup');
            spyOn(component, 'stopPlacing');
            component.onMouseUp(event);
            expect(component.stopPlacing).toHaveBeenCalled();
        });
    });

    describe('Map screenshot', () => {
        it('should capture a screenshot and set imagePreview', async () => {
            const mockImageUrl = 'test-image-url';

            screenshotServiceSpy.captureAndConvert.and.returnValue(Promise.resolve(mockImageUrl));

            await component.screenMap();

            expect(screenshotServiceSpy.captureAndConvert).toHaveBeenCalledWith('screenshot-container');

            expect(mapServiceSpy.map.imagePreview).toBe(mockImageUrl);
        });
    });
});
