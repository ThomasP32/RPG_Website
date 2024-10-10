import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ImageService } from '@app/services/image.service';
import { MapCounterService } from '@app/services/map-counter.service';
import { MapService } from '@app/services/map.service';
import { ScreenShotService } from '@app/services/screenshot/screenshot.service';
import { TileService } from '@app/services/tile.service';
import { Map, Mode, TileCategory } from '@common/map.types';
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

        await TestBed.configureTestingModule({
            declarations: [MapAreaComponent],
            providers: [
                { provide: TileService, useValue: tileServiceSpy },
                { provide: MapService, useValue: mapServiceSpy },
                { provide: MapCounterService, useValue: mapCounterServiceSpy },
                { provide: ImageService, useValue: imageServiceSpy },
                { provide: ScreenShotService, useValue: screenshotServiceSpy },
                { provide: Router, useValue: routerSpy },
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

    it('should capture a screenshot', async () => {
        screenshotServiceSpy.captureAndUpload.and.returnValue(Promise.resolve('image-url'));
        await component.screenMap();
        expect(screenshotServiceSpy.captureAndUpload).toHaveBeenCalledWith('screenshot-container');
        expect(mapServiceSpy.map.imagePreview).toBe('image-url');
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

    it('should generate map data', () => {
        spyOn(component, 'generateMap');
        component.generateMap();
        expect(component.generateMap).toHaveBeenCalled();
    });

    it('should call map service to move item on drop', () => {
        const event = new DragEvent('drop');
        component.currentDraggedItem = { rowIndex: 0, colIndex: 0 };
        spyOn(event, 'preventDefault');
        component.onDrop(event, 1, 1);
        expect(tileServiceSpy.moveItem).toHaveBeenCalled();
    });

    it('should handle drag start only if there is an item', () => {
        const event = new DragEvent('dragstart');
        const cell = { value: 'floor', isHovered: false, item: 'some-item' };
        component.Map[0] = [cell];
        component.startDrag(event, 0, 0);
        expect(component.currentDraggedItem).toEqual({ rowIndex: 0, colIndex: 0 });
    });
});
