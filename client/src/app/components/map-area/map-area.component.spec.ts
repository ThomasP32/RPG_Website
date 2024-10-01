import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ImageService } from '@app/services/image.service';
import { MapCounterService } from '@app/services/map-counter.service';
import { MapGetService } from '@app/services/map-get.service';
import { MapService } from '@app/services/map.service';
import { ScreenShotService } from '@app/services/screenshot/screenshot.service';
import { TileService } from '@app/services/tile.service';
import { ItemCategory, DBMap as Map, Mode, TileCategory } from '@common/map.types';
import { of } from 'rxjs';
import { MapAreaComponent } from './map-area.component';

describe('MapAreaComponent', () => {
    let component: MapAreaComponent;
    let fixture: ComponentFixture<MapAreaComponent>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let mapGetServiceSpy: jasmine.SpyObj<MapGetService>;
    let mapCounterServiceSpy: jasmine.SpyObj<MapCounterService>;
    let imageServiceSpy: jasmine.SpyObj<ImageService>;
    let tileServiceSpy: jasmine.SpyObj<TileService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let screenShotService: jasmine.SpyObj<ScreenShotService>;

    beforeEach(async () => {
        mapServiceSpy = jasmine.createSpyObj('MapService', ['updateSelectedTile', 'updateSelectedTile$', 'mapTitle$', 'mapDescription$']);
        mapGetServiceSpy = jasmine.createSpyObj('MapGetService', ['map']);
        mapCounterServiceSpy = jasmine.createSpyObj('MapCounterService', [
            'startingPointCounter$',
            'randomItemCounter$',
            'itemsCounter$',
            'updateRandomItemCounter',
            'updateStartingPointCounter',
            'updateItemsCounter',
            'updateCounters',
        ]);
        imageServiceSpy = jasmine.createSpyObj('ImageService', ['loadTileImage', 'getItemImage', 'getTileImage']);
        tileServiceSpy = jasmine.createSpyObj('TileService', ['placeTile', 'eraseTile', 'moveItem', 'setItem']);
        routerSpy = jasmine.createSpyObj('Router', ['url', 'navigateByUrl', 'navigate']);
        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', ['snapshot']);

        await TestBed.configureTestingModule({
            imports: [MapAreaComponent],
            providers: [
                { provide: MapService, useValue: mapServiceSpy },
                { provide: MapGetService, useValue: mapGetServiceSpy },
                { provide: MapCounterService, useValue: mapCounterServiceSpy },
                { provide: ImageService, useValue: imageServiceSpy },
                { provide: TileService, useValue: tileServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
                { provide: MapService, useValue: mapServiceSpy },
                { provide: ScreenShotService, useValue: screenShotService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MapAreaComponent);
        component = fixture.componentInstance;
    });

    const mockMap1: Map = {
        _id: '1',
        name: 'Test Map',
        description: 'A test map',
        mapSize: { x: 10, y: 10 },
        mode: Mode.Classic,
        tiles: [
            { coordinate: { x: 0, y: 0 }, category: TileCategory.Water },
            { coordinate: { x: 1, y: 1 }, category: TileCategory.Water },
        ],
        doorTiles: [{ coordinate: { x: 2, y: 2 }, isOpened: true }],
        startTiles: [{ coordinate: { x: 3, y: 3 } }],
        items: [{ coordinate: { x: 4, y: 4 }, category: ItemCategory.Key }],
        isVisible: false,
        lastModified: new Date(),
        imagePreview: '',
    };

    it('should create the map and set tiles correctly', () => {
        const mockMap = {
            _id: '1',
            name: 'Test Map',
            description: 'A test map',
            mapSize: { x: 10, y: 10 },
            mode: Mode.Classic,
            tiles: [
                { coordinate: { x: 1, y: 1 }, category: TileCategory.Ice },
                { coordinate: { x: 2, y: 2 }, category: TileCategory.Water },
            ],
            doorTiles: [
                { coordinate: { x: 3, y: 3 }, isOpened: true },
                { coordinate: { x: 4, y: 4 }, isOpened: false },
            ],
            startTiles: [{ coordinate: { x: 5, y: 5 } }],
            items: [{ coordinate: { x: 6, y: 6 }, category: ItemCategory.Acidgun }],
            isVisible: false,
            lastModified: new Date(),
            imagePreview: '',
        };

        component.createMap = jasmine.createSpy('createMap');

        component.loadMap(mockMap);

        expect(component.createMap).toHaveBeenCalledWith(10);
        expect(component.Map[1][1].value).toBe('ice');
        expect(component.Map[2][2].value).toBe('water');
        expect(component.Map[3][3].value).toBe('door');
        expect(component.Map[3][3].doorState).toBe('open');
        expect(component.Map[4][4].value).toBe('door');
        expect(component.Map[4][4].doorState).toBe('closed');
        expect(component.Map[5][5].item).toBe('starting-point');
        expect(component.Map[6][6].item).toBe('acidgun');
    });

    it('should initialize map in creation mode', fakeAsync(() => {
        routerSpy.navigateByUrl('/creation/size=10/:mode=CTF');
        activatedRouteSpy.snapshot.params = { size: '10', mode: 'CTF' };
        tick();
        component.initMap();

        expect(component.getUrlParams).toHaveBeenCalled();
        expect(component.urlConverter).toHaveBeenCalledWith(component.mapSize);
        expect(component.createMap).toHaveBeenCalledWith(component.convertedMapSize);
        expect(component.setCellSize).toHaveBeenCalled();
        expect(component.setCountersBasedOnMapSize).toHaveBeenCalledWith(component.convertedMapSize);
    }));

    it('should initialize map in edition mode', fakeAsync(async () => {
        await routerSpy.navigateByUrl('/edition/123');
        fixture.detectChanges();
        mapGetServiceSpy.map = mockMap1;

        spyOn(component, 'loadMap');
        spyOn(component, 'setCountersBasedOnMapSize');
        spyOn(component, 'initMap');

        component.initMap();

        expect(component.map).toEqual(mockMap1);
        expect(component.convertedMapSize).toBe(10);
        expect(component.loadMap).toHaveBeenCalledWith(mockMap1);
        expect(component.setCountersBasedOnMapSize).toHaveBeenCalledWith(component.convertedMapSize);
    }));

    it('should subscribe to counter observables', () => {
        mapCounterServiceSpy.startingPointCounter$ = of(5);
        mapCounterServiceSpy.itemsCounter$ = of(10);

        component.initMap();

        expect(component.startingPointCounter).toBe(5);
        expect(component.itemsCounter).toBe(10);
    });

    it('should subscribe to map title and description observables', () => {
        mapServiceSpy.mapTitle$ = of('Test Title');
        mapServiceSpy.mapDescription$ = of('Test Description');

        component.ngOnInit();

        expect(component.mapTitle).toBe('Test Title');
        expect(component.mapDescription).toBe('Test Description');
    });

    it('should subscribe to updateSelectedTile observable', () => {
        mapServiceSpy.updateSelectedTile$ = of('wall');

        component.initMap();

        expect(component.selectedTile).toBe('wall');
    });

    it('should get tile image', () => {
        component.Map = [
            [
                { value: 'door', isHovered: false, doorState: 'closed', item: undefined },
                { value: 'wall', isHovered: false, doorState: undefined, item: undefined },
            ],
            [
                { value: 'ice', isHovered: false, doorState: undefined, item: undefined },
                { value: 'water', isHovered: false, doorState: undefined, item: 'starting-point' },
            ],
        ];

        // Call the getTileImage method with different tile values and coordinates
        // expect(component.getTileImage('door', 0, 0)).toBe('../../../../assets/tiles/door_y.png');
        // expect(component.getTileImage('door', 1, 0)).toBe('../../../../assets/tiles/door_x.png');
        // expect(component.getTileImage('wall', 0, 0)).toBe('../../../../assets/tiles/wall.png');
        // expect(component.getTileImage('ice', 0, 0)).toBe('../../../../assets/tiles/ice1.jpg');
        expect(component.getTileImage('water', 3, 3)).toBe('../../../../assets/tiles/water.png');
        // expect(component.getTileImage('floor', 0, 0)).toBe('../../../../assets/tiles/floor.png');
    });

    it('should get item image', () => {
        expect(component.getItemImage('vest')).toBe('../../../../assets/items/vest.png');
        expect(component.getItemImage('mask')).toBe('../../../../assets/items/mask.png');
        expect(component.getItemImage('jar')).toBe('../../../../assets/items/jar.png');
        expect(component.getItemImage('acidgun')).toBe('../../../../assets/items/acidgun.png');
        expect(component.getItemImage('key')).toBe('../../../../assets/items/keysilver.png');
        expect(component.getItemImage('hat')).toBe('../../../../assets/items/hat.png');
        expect(component.getItemImage('random')).toBe('../../../../assets/items/randomchest.png');
        expect(component.getItemImage('starting-point')).toBe('../../../../assets/tiles/startingpoint.png');
    });

    it('should get URL parameters', () => {
        const expectedMapSize = 'size=15';
        activatedRouteSpy.snapshot.params = { size: expectedMapSize };
        activatedRouteSpy.params = of({});

        component.getUrlParams();
        expect(component.mapSize).toBe(expectedMapSize);
        component.urlConverter(expectedMapSize);
        expect(component.convertedMapSize).toBe(15);
    });

    it('should load map data correctly', () => {
        const mockMap2: Map = {
            _id: '1',
            name: 'Test Map',
            description: 'A test map',
            mapSize: { x: 10, y: 10 },
            mode: Mode.Classic,
            tiles: [
                { coordinate: { x: 0, y: 0 }, category: TileCategory.Water },
                { coordinate: { x: 1, y: 1 }, category: TileCategory.Water },
            ],
            doorTiles: [{ coordinate: { x: 2, y: 2 }, isOpened: true }],
            startTiles: [{ coordinate: { x: 3, y: 3 } }],
            items: [{ coordinate: { x: 4, y: 4 }, category: ItemCategory.Key }],
            isVisible: false,
            lastModified: new Date(),
            imagePreview: '',
        };

        component.loadMap(mockMap2);

        expect(component.Map[0][0].value).toBe(TileCategory.Water);
        expect(component.Map[1][1].value).toBe(TileCategory.Water);
        expect(component.Map[2][2].value).toBe('door');
        expect(component.Map[2][2].doorState).toBe('open');
        expect(component.Map[3][3].item).toBe('starting-point');
        expect(component.Map[4][4].item).toBe(ItemCategory.Key);
    });
    it('should generate map data correctly', () => {
        component.mapTitle = 'Test Map';
        component.mapDescription = 'This is a test map';
        component.convertedMapSize = 10;

        component.Map = [
            [
                { value: 'door', isHovered: false, doorState: 'closed', item: undefined },
                { value: 'wall', isHovered: false, doorState: undefined, item: ItemCategory.Key },
            ],
            [
                { value: 'ice', isHovered: false, doorState: undefined, item: 'starting-point' },
                { value: 'water', isHovered: false, doorState: undefined, item: undefined },
            ],
        ];

        const mapData = component.generateMapData();

        expect(mapData.name).toBe('Test Map');
        expect(mapData.description).toBe('This is a test map');
        expect(mapData.mapSize).toEqual({ x: 10, y: 10 });
        expect(mapData.tiles).toEqual([
            { coordinate: { x: 0, y: 1 }, category: TileCategory.Wall },
            { coordinate: { x: 1, y: 0 }, category: TileCategory.Ice },
            { coordinate: { x: 1, y: 1 }, category: TileCategory.Water },
        ]);
        expect(mapData.doorTiles).toEqual([{ coordinate: { x: 0, y: 0 }, isOpened: false }]);
        expect(mapData.items).toEqual([{ coordinate: { x: 0, y: 1 }, category: ItemCategory.Key }]);
        expect(mapData.startTiles).toEqual([{ coordinate: { x: 1, y: 0 } }]);
    });

    it('should set counters based on map size', () => {
        component.setCountersBasedOnMapSize(10);
        expect(mapCounterServiceSpy.updateRandomItemCounter).toHaveBeenCalledWith(2);
        expect(mapCounterServiceSpy.updateStartingPointCounter).toHaveBeenCalledWith(2);
        expect(mapCounterServiceSpy.updateItemsCounter).toHaveBeenCalledWith(10);

        component.setCountersBasedOnMapSize(15);
        expect(mapCounterServiceSpy.updateRandomItemCounter).toHaveBeenCalledWith(4);
        expect(mapCounterServiceSpy.updateStartingPointCounter).toHaveBeenCalledWith(4);
        expect(mapCounterServiceSpy.updateItemsCounter).toHaveBeenCalledWith(14);

        component.setCountersBasedOnMapSize(20);
        expect(mapCounterServiceSpy.updateRandomItemCounter).toHaveBeenCalledWith(6);
        expect(mapCounterServiceSpy.updateStartingPointCounter).toHaveBeenCalledWith(6);
        expect(mapCounterServiceSpy.updateItemsCounter).toHaveBeenCalledWith(18);
    });

    it('should reset map to default in creation mode', () => {
        activatedRouteSpy.snapshot.params = { mode: 'classic' };
        component.convertedMapSize = 10;
        component.Map = [
            [
                {
                    value: 'wall',
                    item: 'item1',
                    isHovered: false,
                },
                {
                    value: 'door',
                    item: undefined,
                    isHovered: false,
                },
            ],
            [
                {
                    value: 'water',
                    item: 'starting-point',
                    isHovered: false,
                },
                {
                    value: 'ice',
                    item: undefined,
                    isHovered: false,
                },
            ],
        ];

        spyOn(component, 'setCountersBasedOnMapSize');

        component.resetMapToDefault();

        expect(component.Map[0][0].value).toBe('floor');
        expect(component.Map[0][1].value).toBe('floor');
        expect(component.Map[1][0].value).toBe('floor');
        expect(component.Map[1][1].value).toBe('floor');
        expect(component.Map[0][0].item).toBeUndefined();
        expect(component.Map[1][0].item).toBeUndefined();
        expect(component.setCountersBasedOnMapSize).toHaveBeenCalledWith(10);
    });

    it('should load map in edition mode', () => {
        activatedRouteSpy.snapshot.params = {};
        component.map = mockMap1;

        spyOn(component, 'loadMap');

        component.resetMapToDefault();

        expect(component.loadMap).toHaveBeenCalledWith(mockMap1);
    });
});
