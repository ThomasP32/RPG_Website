import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ImageService } from '@app/services/image/image.service';
import { MapCounterService } from '@app/services/map-counter/map-counter.service';
import { MapService } from '@app/services/map/map.service';
import { Mode } from '@common/map.types';
import { BehaviorSubject, of } from 'rxjs';
import { ToolbarComponent } from './toolbar.component';

describe('ToolbarComponent', () => {
    let component: ToolbarComponent;
    let fixture: ComponentFixture<ToolbarComponent>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let mapCounterServiceSpy: jasmine.SpyObj<MapCounterService>;
    let imageServiceSpy: jasmine.SpyObj<ImageService>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;

    let updateSelectedTileSubject: BehaviorSubject<string>;
    let startingPointCounterSubject: BehaviorSubject<number>;

    beforeEach(async () => {
        updateSelectedTileSubject = new BehaviorSubject<string>('');
        startingPointCounterSubject = new BehaviorSubject<number>(0);

        mapServiceSpy = jasmine.createSpyObj('MapService', ['updateSelectedTile']);
        mapServiceSpy.updateSelectedTile$ = updateSelectedTileSubject.asObservable();
        mapCounterServiceSpy = jasmine.createSpyObj('MapCounterService', [
            'startingPointCounter$',
            'randomItemCounter$',
            'itemsCounter$',
            'updateStartingPointCounter',
        ]);
        mapCounterServiceSpy.startingPointCounter$ = startingPointCounterSubject.asObservable();

        imageServiceSpy = jasmine.createSpyObj('ImageService', ['loadTileImage', 'getItemImage']);
        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', ['snapshot'], { snapshot: { params: {} } });
        mapServiceSpy.map = { mode: Mode.Classic } as any;

        await TestBed.configureTestingModule({
            imports: [ToolbarComponent],
            providers: [
                { provide: MapService, useValue: mapServiceSpy },
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
        activatedRouteSpy.snapshot.params = { mode: 'mode=classique' };
        activatedRouteSpy.queryParams = of({});
        component.ngOnInit();

        expect(component.mode).toBe('classique');
    });

    it('should initialize in edition mode', () => {
        activatedRouteSpy.snapshot.params = { id: '1' };
        mapServiceSpy.map = { mode: Mode.Ctf } as any;
        component.ngOnInit();
        expect(component.mode).toBe('ctf');
    });

    it('should set mode and subscribe to updateSelectedTile$ and startingPointCounter$', () => {
        const mockSelectedTile = 'floor';
        const mockCounter = 3;

        updateSelectedTileSubject.next(mockSelectedTile);
        startingPointCounterSubject.next(mockCounter);

        activatedRouteSpy.snapshot.params = { mode: 'classique' };
        component.ngOnInit();

        expect(component.mode).toBe('classique');

        expect(component.selectedTile).toBe(mockSelectedTile);

        expect(mapCounterServiceSpy.startingPointCounter).toBe(mockCounter);
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
        component.selectedTile = 'wall';
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

    it('should update starting point counter on subscription', () => {
        const startingPointCounterSubject = new BehaviorSubject<number>(0);
        mapCounterServiceSpy.startingPointCounter$ = startingPointCounterSubject.asObservable();

        component.ngOnInit();

        startingPointCounterSubject.next(5);

        expect(mapCounterServiceSpy.startingPointCounter).toBe(5);
    });
});
