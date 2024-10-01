import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ImageService } from '@app/services/image.service';
import { MapCounterService } from '@app/services/map-counter.service';
import { MapGetService } from '@app/services/map-get.service';
import { MapService } from '@app/services/map.service';
import { DBMap as Map, Mode } from '@common/map.types';
import { of } from 'rxjs';
import { ToolbarComponent } from './toolbar.component';

describe('ToolbarComponent', () => {
    let component: ToolbarComponent;
    let fixture: ComponentFixture<ToolbarComponent>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let mapGetServiceSpy: jasmine.SpyObj<MapGetService>;
    let mapCounterServiceSpy: jasmine.SpyObj<MapCounterService>;
    let imageServiceSpy: jasmine.SpyObj<ImageService>;
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
        mode: Mode.Ctf,
        lastModified: new Date(),
        description: '',
        imagePreview: '',
    };

    beforeEach(async () => {
        mapServiceSpy = jasmine.createSpyObj('MapService', ['updateSelectedTile', 'updateSelectedTile$']);
        mapGetServiceSpy = jasmine.createSpyObj('MapGetService', ['map']);
        mapCounterServiceSpy = jasmine.createSpyObj('MapCounterService', [
            'startingPointCounter$',
            'randomItemCounter$',
            'itemsCounter$',
            'updateStartingPointCounter',
            'startingPointCounter',
        ]);
        imageServiceSpy = jasmine.createSpyObj('ImageService', ['loadTileImage', 'getItemImage']);
        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', ['snapshot'], { snapshot: { params: {} } });

        await TestBed.configureTestingModule({
            imports: [ToolbarComponent],
            providers: [
                { provide: MapService, useValue: mapServiceSpy },
                { provide: MapGetService, useValue: mapGetServiceSpy },
                { provide: MapCounterService, useValue: mapCounterServiceSpy },
                { provide: ImageService, useValue: imageServiceSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ToolbarComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize in creation mode', () => {
        activatedRouteSpy.snapshot.params = { mode: 'mode=classic' };
        activatedRouteSpy.queryParams = of({});
        component.ngOnInit();

        expect(component.mode).toBe('classic');
    });

    it('should initialize in edition mode', () => {
        activatedRouteSpy.snapshot.params = { id: '123' };
        mapGetServiceSpy.map = mockMap;

        component.ngOnInit();

        expect(component.mode).toBe(Mode.Ctf);
    });

    it('should toggle tiles visibility', () => {
        component.toggleTiles();
        expect(component.isTilesVisible).toBe(false);
        component.toggleTiles();
        expect(component.isTilesVisible).toBe(true);
    });

    it('should toggle items visibility', () => {
        component.toggleItems();
        expect(component.isItemsVisible).toBe(false);
        component.toggleItems();
        expect(component.isItemsVisible).toBe(true);
    });

    it('should toggle flag visibility', () => {
        component.toggleFlag();
        expect(component.isFlagVisible).toBe(false);
        component.toggleFlag();
        expect(component.isFlagVisible).toBe(true);
    });

    it('should toggle starting point visibility', () => {
        component.toggleStartingPoint();
        expect(component.isStartingPointVisible).toBe(false);
        component.toggleStartingPoint();
        expect(component.isStartingPointVisible).toBe(true);
    });

    it('should select tile', () => {
        component.selectTile('wall');
        expect(component.selectedTile).toBe('wall');
        expect(mapServiceSpy.updateSelectedTile).toHaveBeenCalledWith('wall');
    });

    it('should unselect tile', () => {
        mapServiceSpy.updateSelectedTile$ = of('wall');
        component.ngOnInit();
        component.selectTile('wall');
        expect(mapServiceSpy.updateSelectedTile).toHaveBeenCalledWith('empty');
    });

    it('should start drag for starting point', () => {
        const mockDragEvent = { dataTransfer: { setData: jasmine.createSpy('setData') } } as any as DragEvent;
        component.startDrag(mockDragEvent, 'starting-point');
        expect(mockDragEvent.dataTransfer?.setData).toHaveBeenCalledWith('item', 'starting-point');
    });

    it('should start drag for starting point with counter > 0', () => {
        const mockDragEvent = { dataTransfer: { setData: jasmine.createSpy('setData') } } as any as DragEvent;
        mapCounterServiceSpy.startingPointCounter = 2;
        component.startDrag(mockDragEvent, 'starting-point');
        expect(mockDragEvent.dataTransfer?.setData).toHaveBeenCalledWith('item', 'starting-point');
        expect(mapServiceSpy.updateSelectedTile).toHaveBeenCalledWith('empty');
    });

    it('should NOT start drag for other item types', () => {
        const mockDragEvent = { dataTransfer: { setData: jasmine.createSpy('setData') } } as any as DragEvent;
        component.startDrag(mockDragEvent, 'item1');
        expect(mockDragEvent.dataTransfer?.setData).not.toHaveBeenCalled();
        expect(mapServiceSpy.updateSelectedTile).not.toHaveBeenCalled();
    });

    it('should place starting point', () => {
        mapCounterServiceSpy.startingPointCounter = 2;
        component.placeStartingPoint();
        expect(mapCounterServiceSpy.updateStartingPointCounter).toHaveBeenCalledWith(1);
    });

    it('should select item', () => {
        mapCounterServiceSpy.startingPointCounter = 0;
        component.selectItem('item1');
        expect(component.isStartingPointVisible).toBe(false);
        expect(mapServiceSpy.updateSelectedTile).toHaveBeenCalledWith('empty');
    });

    it('should get tile image', () => {
        component.getTileImage('wall');
        expect(imageServiceSpy.loadTileImage).toHaveBeenCalledWith('wall');
    });

    it('should get item image', () => {
        component.getItemImage('item1');
        expect(imageServiceSpy.getItemImage).toHaveBeenCalledWith('item1');
    });

    it('should get URL parameters', () => {
        activatedRouteSpy.snapshot.params = { mode: 'mode=classic' };
        activatedRouteSpy.queryParams = of({});
        component.getUrlParams();
        expect(component.mode).toBe('mode=classic');
    });

    it('should convert mode from URL', () => {
        component.mode = 'mode=classic';
        component.urlConverterMode();
        expect(component.convertedMode).toBe('classic');
        expect(component.mode).toBe('classic');
    });

    it('should update starting point counter on subscription', () => {
        mapCounterServiceSpy.startingPointCounter = 5;
        component.ngOnInit();
        expect(mapCounterServiceSpy.startingPointCounter).toBe(5);
    });

    it('should update random item counter on subscription', () => {
        mapCounterServiceSpy.randomItemCounter$ = of(5);
        component.ngOnInit();
        expect(mapCounterServiceSpy.randomItemCounter$).toBeTruthy();
    });

    it('should update items counter on subscription', () => {
        mapCounterServiceSpy.itemsCounter$ = of(5);
        component.ngOnInit();
        expect(mapCounterServiceSpy.itemsCounter$).toBeTruthy();
    });
});
