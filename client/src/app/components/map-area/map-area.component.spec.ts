import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ImageService } from '@app/services/image/image.service';
import { MapCounterService } from '@app/services/map-counter/map-counter.service';
import { MapService } from '@app/services/map/map.service';
import { ScreenShotService } from '@app/services/screenshot/screenshot.service';
import { TileService } from '@app/services/tile/tile.service';
import { Cell } from '@common/map-cell';
import { DetailedMap, ItemCategory, Mode, TileCategory } from '@common/map.types';
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
        tileServiceSpy = jasmine.createSpyObj('TileService', [
            'placeTile',
            'eraseTile',
            'moveItem',
            'setItem',
            'setStartingPoint',
            'removeStartingPoint',
        ]);
        mapServiceSpy = jasmine.createSpyObj('MapService', ['updateSelectedTile$', 'removeStartingPoint$', 'map', 'generateMapFromEdition']);
        mapCounterServiceSpy = jasmine.createSpyObj('MapCounterService', [
            'startingPointCounter$',
            'updateCounters',
            'updateStartingPointCounter',
            'initializeCounters',
            'loadMapCounters',
        ]);
        imageServiceSpy = jasmine.createSpyObj('ImageService', ['getTileImage', 'getItemImage', 'getStartingPointImage', 'getDoorImage']);
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
        mapServiceSpy.removeStartingPoint$ = of(false);
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
            spyOn(component, 'initializeCreationMode');
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
            mapCounterServiceSpy.startingPointCounter = 2;

            component.initializeEditionMode();

            expect(mapCounterServiceSpy.initializeCounters).toHaveBeenCalledWith(mapSize, Mode.Classic);
            expect(mapCounterServiceSpy.startingPointCounter).toBe(5 - startTilesLength);
            expect(component.loadMap).toHaveBeenCalledWith(mapServiceSpy.map);
        });

        it('should initialize creation mode correctly', () => {
            spyOn(component, 'createMap');
            component.initializeCreationMode();
            expect(component.createMap).toHaveBeenCalledWith(mapServiceSpy.map.mapSize.x);
            expect(mapCounterServiceSpy.initializeCounters).toHaveBeenCalledWith(mapServiceSpy.map.mapSize.x, mapServiceSpy.map.mode);
        });
    });

    describe('Map management', () => {
        it('should reset the map to default tile when mode is truthy', () => {
            component.map = [[{ tileType: TileCategory.Wall, isHovered: false } as Cell, { tileType: TileCategory.Door, isHovered: false } as Cell]];
            component.resetMapToDefault();

            expect(component.map[0][0].tileType).toBe(component.defaultTile);
            expect(component.map[0][1].tileType).toBe(component.defaultTile);

            expect(component.map[0][0].item).toBeUndefined();
            expect(component.map[0][1].item).toBeUndefined();
        });
        it('should reset the map to default tile when mode is truthy', () => {
            component.map = [[{ tileType: TileCategory.Wall, isHovered: false } as Cell, { tileType: TileCategory.Door, isHovered: false } as Cell]];
            component.resetMapToDefault();

            expect(component.map[0][0].tileType).toBe(component.defaultTile);
            expect(component.map[0][1].tileType).toBe(component.defaultTile);

            expect(component.map[0][0].item).toBeUndefined();
            expect(component.map[0][1].item).toBeUndefined();
        });

        it('should load map correctly', () => {
            const mockMap: DetailedMap = {
                _id: '1',
                name: 'Test Map',
                mapSize: { x: 2, y: 2 },
                tiles: [{ coordinate: { x: 0, y: 0 }, category: TileCategory.Wall }],
                doorTiles: [{ coordinate: { x: 1, y: 1 }, isOpened: true }],
                startTiles: [{ coordinate: { x: 0, y: 1 } }],
                items: [{ coordinate: { x: 1, y: 0 }, category: ItemCategory.Armor }],
                mode: Mode.Classic,
                lastModified: new Date(),
                description: '',
                imagePreview: '',
                isVisible: true,
            };
            component.loadMap(mockMap);
            expect(component.map[0][0].tileType).toBe(TileCategory.Wall);
            expect(component.map[1][1].door.isDoor).toBeTrue();
            expect(component.map[1][1].door.isOpen).toBeTrue();
            expect(component.map[1][0].item).toBe(ItemCategory.Armor);
            expect(component.map[0][1].isStartingPoint).toBeTrue();
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
            expect(component.map[0][0].tileType).toBe(TileCategory.Wall);
        });

        it('should generate map', () => {
            spyOn(component, 'generateMap');
            component.generateMap();
            expect(component.generateMap).toHaveBeenCalled();
        });

        it('should correctly generate map with tiles, doors, items, and starting points', () => {
            component.map = [
                [
                    {
                        tileType: TileCategory.Wall,
                        isHovered: false,
                        coordinate: { x: 0, y: 0 },
                        door: { isOpen: false, isDoor: false },
                        isStartingPoint: false,
                        isOccupied: false,
                        alternateCoordinates: { x: 0, y: 0 },
                    },
                    {
                        tileType: TileCategory.Door,
                        isHovered: false,
                        door: { isOpen: true, isDoor: true },
                        coordinate: { x: 0, y: 1 },
                        isStartingPoint: false,
                        isOccupied: false,
                        alternateCoordinates: { x: 0, y: 1 },
                    },
                ],
                [
                    { tileType: TileCategory.Floor, isHovered: false, item: ItemCategory.Armor } as Cell,
                    { tileType: TileCategory.Floor, isHovered: false, isStartingPoint: true } as Cell,
                ],
            ];

            component.generateMap();

            expect(mapServiceSpy.generateMapFromEdition).toHaveBeenCalledWith(component.map);
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
            const item = ItemCategory.Armor;
            component.map = [
                [
                    {
                        tileType: TileCategory.Floor,
                        isHovered: false,
                        item: ItemCategory.Armor,
                        coordinate: { x: 0, y: 0 },
                        door: { isOpen: false, isDoor: false },
                        isStartingPoint: false,
                        isOccupied: false,
                    } as Cell,
                ],
            ];

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
            expect(tileServiceSpy.placeTile).toHaveBeenCalledWith(component.map, rowIndex, colIndex, component.selectedTile);
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
            expect(tileServiceSpy.placeTile).toHaveBeenCalledWith(component.map, rowIndex, colIndex, component.selectedTile);
        });

        it('should call preventDefault on allowDrop', () => {
            const event = new DragEvent('dragover');
            spyOn(event, 'preventDefault');

            component.allowDrop(event);

            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should handle drag start only if there is a starting-point', () => {
            const event = new DragEvent('dragstart');
            const cell: Cell = {
                tileType: TileCategory.Floor,
                isHovered: false,
                coordinate: { x: 0, y: 0 },
                door: { isOpen: false, isDoor: false },
                isStartingPoint: false,
                isOccupied: false,
                alternateCoordinates: { x: 0, y: 0 },
            };
            component.map = [[cell]];

            component.startDrag(event, 0, 0);

            expect(component.currentDraggedItem).toEqual(null);
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

            expect(tileServiceSpy.eraseTile).toHaveBeenCalledWith(component.map, rowIndex, colIndex, component.defaultTile);
            expect(tileServiceSpy.placeTile).not.toHaveBeenCalled();
        });
    });

    describe('Map counters', () => {
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

            expect(tileServiceSpy.eraseTile).toHaveBeenCalledWith(component.map, rowIndex, colIndex, component.defaultTile);
            expect(component.isRightClickDown).toBeTrue();
        });

        it('should call stopPlacing when mouse up event is triggered', () => {
            spyOn(component, 'stopPlacing');
            component.onMouseUp();
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

    describe('getStartingPointImage', () => {
        it('should call imageService.getStartingPointImage and return the result', () => {
            const mockImage = 'mock-starting-point-image';
            imageServiceSpy.getStartingPointImage.and.returnValue(mockImage);

            const result = component.getStartingPointImage();

            expect(imageServiceSpy.getStartingPointImage).toHaveBeenCalled();
            expect(result).toBe(mockImage);
        });
    });
    describe('removeStartingPoint', () => {
        it('should remove starting point if isRemoving is true and currentDraggedItem is not null', () => {
            component.currentDraggedItem = { rowIndex: 1, colIndex: 1 };
            component.removeStartingPoint(true);
            expect(tileServiceSpy.removeStartingPoint).toHaveBeenCalledWith(component.map, 1, 1);
            expect(component.currentDraggedItem).toBeNull();
        });

        it('should not remove starting point if isRemoving is false', () => {
            component.currentDraggedItem = { rowIndex: 1, colIndex: 1 };
            component.removeStartingPoint(false);
            expect(tileServiceSpy.removeStartingPoint).not.toHaveBeenCalled();
            expect(component.currentDraggedItem).toBeNull();
        });

        it('should not remove starting point if currentDraggedItem is null', () => {
            component.currentDraggedItem = null;
            component.removeStartingPoint(true);
            expect(tileServiceSpy.removeStartingPoint).not.toHaveBeenCalled();
        });
    });

    describe('onDrop', () => {
        let event: DragEvent;
        let rowIndex: number;
        let colIndex: number;

        beforeEach(() => {
            event = new DragEvent('drop');
            rowIndex = 0;
            colIndex = 0;
            spyOn(event, 'preventDefault');
        });

        it('should prevent default if target tile is a wall', () => {
            component.map = [[{ tileType: TileCategory.Wall, isStartingPoint: false, door: { isDoor: false } } as Cell]];
            Object.defineProperty(event, 'dataTransfer', {
                value: {
                    getData: jasmine.createSpy('getData').and.returnValue(JSON.stringify(ItemCategory.StartingPoint)),
                },
            });

            component.onDrop(event, rowIndex, colIndex);

            expect(tileServiceSpy.setStartingPoint).not.toHaveBeenCalled();
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should set starting point if dragging object is StartingPoint', () => {
            component.map = [[{ tileType: TileCategory.Floor, isStartingPoint: false, door: { isDoor: false } } as Cell]];
            Object.defineProperty(event, 'dataTransfer', {
                value: {
                    getData: jasmine.createSpy('getData').and.returnValue(JSON.stringify(ItemCategory.StartingPoint)),
                },
            });

            component.onDrop(event, rowIndex, colIndex);

            expect(tileServiceSpy.setStartingPoint).toHaveBeenCalledWith(component.map, rowIndex, colIndex);
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should set item if dragging object is not StartingPoint', () => {
            component.map = [[{ tileType: TileCategory.Floor, isStartingPoint: false, door: { isDoor: false } } as Cell]];
            Object.defineProperty(event, 'dataTransfer', {
                value: {
                    getData: jasmine.createSpy('getData').and.returnValue(JSON.stringify(ItemCategory.Armor)),
                },
            });

            component.onDrop(event, rowIndex, colIndex);

            expect(tileServiceSpy.setItem).toHaveBeenCalledWith(component.map, ItemCategory.Armor, { rowIndex, colIndex });
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should prevent default if target tile is a door', () => {
            component.map = [[{ tileType: TileCategory.Floor, isStartingPoint: false, door: { isDoor: true } } as Cell]];
            Object.defineProperty(event, 'dataTransfer', {
                value: {
                    getData: jasmine.createSpy('getData').and.returnValue(JSON.stringify(ItemCategory.StartingPoint)),
                },
            });

            component.onDrop(event, rowIndex, colIndex);

            expect(tileServiceSpy.setStartingPoint).not.toHaveBeenCalled();
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should prevent default if target tile is already a starting point', () => {
            component.map = [[{ tileType: TileCategory.Floor, isStartingPoint: true, door: { isDoor: false } } as Cell]];
            Object.defineProperty(event, 'dataTransfer', {
                value: {
                    getData: jasmine.createSpy('getData').and.returnValue(JSON.stringify(ItemCategory.StartingPoint)),
                },
            });

            component.onDrop(event, rowIndex, colIndex);

            expect(tileServiceSpy.setStartingPoint).not.toHaveBeenCalled();
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should not call setStartingPoint if the target tile is a wall', () => {
            const event = new DragEvent('drop');
            spyOn(event, 'preventDefault');

            Object.defineProperty(event, 'dataTransfer', {
                value: {
                    getData: jasmine.createSpy('getData').and.returnValue(JSON.stringify('draggingObject')),
                },
            });

            component.map = [[{ tileType: TileCategory.Wall, isStartingPoint: false } as Cell]];

            component.onDrop(event, 0, 0);

            expect(tileServiceSpy.setStartingPoint).not.toHaveBeenCalled();
            expect(event.preventDefault).toHaveBeenCalled();
        });
    });
    describe('onDrop', () => {
        let event: DragEvent;
        let rowIndex: number;
        let colIndex: number;

        beforeEach(() => {
            event = new DragEvent('drop');
            rowIndex = 0;
            colIndex = 0;
            spyOn(event, 'preventDefault');
        });

        it('should prevent default if target tile is a wall', () => {
            component.map = [[{ tileType: TileCategory.Wall, isStartingPoint: false, door: { isDoor: false } } as Cell]];
            Object.defineProperty(event, 'dataTransfer', {
                value: {
                    getData: jasmine.createSpy('getData').and.returnValue(JSON.stringify(ItemCategory.StartingPoint)),
                },
            });

            component.onDrop(event, rowIndex, colIndex);

            expect(tileServiceSpy.setStartingPoint).not.toHaveBeenCalled();
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should set starting point if dragging object is StartingPoint', () => {
            component.map = [[{ tileType: TileCategory.Floor, isStartingPoint: false, door: { isDoor: false } } as Cell]];
            Object.defineProperty(event, 'dataTransfer', {
                value: {
                    getData: jasmine.createSpy('getData').and.returnValue(JSON.stringify(ItemCategory.StartingPoint)),
                },
            });

            component.onDrop(event, rowIndex, colIndex);

            expect(tileServiceSpy.setStartingPoint).toHaveBeenCalledWith(component.map, rowIndex, colIndex);
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should set item if dragging object is not StartingPoint', () => {
            component.map = [[{ tileType: TileCategory.Floor, isStartingPoint: false, door: { isDoor: false } } as Cell]];
            Object.defineProperty(event, 'dataTransfer', {
                value: {
                    getData: jasmine.createSpy('getData').and.returnValue(JSON.stringify(ItemCategory.Armor)),
                },
            });

            component.onDrop(event, rowIndex, colIndex);

            expect(tileServiceSpy.setItem).toHaveBeenCalledWith(component.map, ItemCategory.Armor, { rowIndex, colIndex });
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should prevent default if target tile is a door', () => {
            component.map = [[{ tileType: TileCategory.Floor, isStartingPoint: false, door: { isDoor: true } } as Cell]];
            Object.defineProperty(event, 'dataTransfer', {
                value: {
                    getData: jasmine.createSpy('getData').and.returnValue(JSON.stringify(ItemCategory.StartingPoint)),
                },
            });

            component.onDrop(event, rowIndex, colIndex);

            expect(tileServiceSpy.setStartingPoint).not.toHaveBeenCalled();
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should prevent default if target tile is already a starting point', () => {
            component.map = [[{ tileType: TileCategory.Floor, isStartingPoint: true, door: { isDoor: false } } as Cell]];
            Object.defineProperty(event, 'dataTransfer', {
                value: {
                    getData: jasmine.createSpy('getData').and.returnValue(JSON.stringify(ItemCategory.StartingPoint)),
                },
            });

            component.onDrop(event, rowIndex, colIndex);

            expect(tileServiceSpy.setStartingPoint).not.toHaveBeenCalled();
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should move item if currentDraggedItem is not null', () => {
            const mockDragEvent = {
                preventDefault: jasmine.createSpy('preventDefault'),
                dataTransfer: {
                    getData: jasmine.createSpy('getData').and.returnValue(JSON.stringify(ItemCategory.Armor)),
                },
            } as any as DragEvent;

            component.currentDraggedItem = { rowIndex: 1, colIndex: 1 };
            component.map = [
                [{ tileType: TileCategory.Floor, isStartingPoint: false, door: { isDoor: false } } as Cell],
                [{ tileType: TileCategory.Floor, isStartingPoint: false, door: { isDoor: false } } as Cell],
            ];

            component.onDrop(mockDragEvent, 0, 0);

            expect(tileServiceSpy.moveItem).toHaveBeenCalledWith(component.map, { rowIndex: 1, colIndex: 1 }, { rowIndex: 0, colIndex: 0 });

            expect(component.currentDraggedItem).toBeNull();
            expect(mockDragEvent.preventDefault).not.toHaveBeenCalled();
        });
    });
    describe('getTileImage', () => {
        it('should return door image when tile type is Door and door is open', () => {
            const rowIndex = 0;
            const colIndex = 0;
            component.map = [
                [
                    {
                        tileType: TileCategory.Door,
                        door: { isOpen: true, isDoor: true },
                    } as Cell,
                ],
            ];

            const result = component.getTileImage(TileCategory.Door, rowIndex, colIndex);
            expect(imageServiceSpy.getDoorImage).toHaveBeenCalledWith(true);
            expect(result).toBe(imageServiceSpy.getDoorImage(true));
        });

        it('should return door image when tile type is Door and door is closed', () => {
            const rowIndex = 0;
            const colIndex = 0;
            component.map = [
                [
                    {
                        tileType: TileCategory.Door,
                        door: { isOpen: false, isDoor: true },
                    } as Cell,
                ],
            ];

            const result = component.getTileImage(TileCategory.Door, rowIndex, colIndex);
            expect(imageServiceSpy.getDoorImage).toHaveBeenCalledWith(false);
            expect(result).toBe(imageServiceSpy.getDoorImage(false));
        });
    });
    describe('resetMapToDefault', () => {
        it('should reset the map to default tile and initialize counters when in creation mode', () => {
            spyOn(component, 'isCreationMode').and.returnValue(true);

            component.map = [
                [{ tileType: TileCategory.Wall, item: ItemCategory.Armor, isStartingPoint: true } as Cell],
                [{ tileType: TileCategory.Door, item: ItemCategory.Sword, isStartingPoint: false } as Cell],
            ];

            component.resetMapToDefault();

            component.map.forEach((row) => {
                row.forEach((cell) => {
                    expect(cell.tileType).toBe(component.defaultTile);
                    expect(cell.item).toBeUndefined();
                    expect(cell.isStartingPoint).toBeFalse();
                });
            });

            expect(mapCounterServiceSpy.initializeCounters).toHaveBeenCalledWith(mapServiceSpy.map.mapSize.x, 'classic');
        });

        it('should reset the map to default tile and load map counters when not in creation mode', () => {
            spyOn(component, 'isCreationMode').and.returnValue(false);
            spyOn(component, 'loadMap');

            component.map = [
                [{ tileType: TileCategory.Wall, item: ItemCategory.Armor, isStartingPoint: true } as Cell],
                [{ tileType: TileCategory.Door, item: ItemCategory.Sword, isStartingPoint: false } as Cell],
            ];

            component.resetMapToDefault();

            expect(mapCounterServiceSpy.initializeCounters).toHaveBeenCalledWith(mapServiceSpy.map.mapSize.x, mapServiceSpy.map.mode);
            expect(mapCounterServiceSpy.loadMapCounters).toHaveBeenCalledWith(mapServiceSpy.map);
            expect(component.loadMap).toHaveBeenCalledWith(mapServiceSpy.map);
        });
    });
});
