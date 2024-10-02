import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MapGetService } from '@app/services/map-get.service';
import { MapService } from '@app/services/map.service';
import { DBMap, Mode } from '@common/map.types';
import { Types } from 'mongoose';
import { MapControlBarComponent } from './map-control-bar.component';

describe('MapControlBarComponent', () => {
    let component: MapControlBarComponent;
    let fixture: ComponentFixture<MapControlBarComponent>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let mapGetServiceSpy: jasmine.SpyObj<MapGetService>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;

    const mapId = new Types.ObjectId().toString();
    const mockMap: DBMap = {
        _id: new Types.ObjectId(mapId),
        name: 'Test Map',
        description: 'This is a test map',
        imagePreview: 'http://example.com/test.png',
        mode: Mode.Classic,
        mapSize: { x: 20, y: 20 },
        startTiles: [{ coordinate: { x: 0, y: 0 } }],
        items: [],
        tiles: [],
        doorTiles: [],
        isVisible: true,
        lastModified: new Date(),
    };

    beforeEach(async () => {
        mapServiceSpy = jasmine.createSpyObj('MapService', [
            'resetMap',
            'saveNewMap',
            'setMapTitle',
            'setMapDescription',
            'generateMapData',
            'saveEditedMap',
            'updateMap',
        ]);
        mapGetServiceSpy = jasmine.createSpyObj('MapGetService', ['map']);
        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', ['snapshot']);

        await TestBed.configureTestingModule({
            imports: [MapControlBarComponent],
            providers: [
                { provide: MapService, useValue: mapServiceSpy },
                { provide: MapGetService, useValue: mapGetServiceSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MapControlBarComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize in creation mode', () => {
        activatedRouteSpy.snapshot.params = { mode: 'classic' };

        component.ngOnInit();

        expect(component.mode).toBe('classic');
    });

    it('should initialize in edition mode', () => {
        activatedRouteSpy.snapshot.params = { id: '1' };
        mapGetServiceSpy.map = mockMap;

        component.ngOnInit();

        expect(component.mapTitle).toBe(mockMap.name);
        expect(component.mapDescription).toBe(mockMap.description);
    });

    it('should toggle edit title', () => {
        component.toggleEditTitle();
        expect(component.isEditingTitle).toBe(true);
        component.toggleEditTitle();
        expect(component.isEditingTitle).toBe(false);
    });

    it('should toggle edit description', () => {
        component.toggleEditDescription();
        expect(component.isEditingDescription).toBe(true);
        component.toggleEditDescription();
        expect(component.isEditingDescription).toBe(false);
    });

    it('should reset map', () => {
        activatedRouteSpy.snapshot.params = { mode: Mode.Classic };
        component.resetMap();
        expect(mapServiceSpy.resetMap).toHaveBeenCalled();
    });

    it('should save map in creation mode', () => {
        activatedRouteSpy.snapshot.params = { mode: Mode.Classic };
        component.mapTitle = 'New Map';
        component.mapDescription = 'New Description';

        component.saveMap();

        expect(mapServiceSpy.setMapTitle).toHaveBeenCalledWith('New Map');
        expect(mapServiceSpy.setMapDescription).toHaveBeenCalledWith('New Description');
        expect(mapServiceSpy.generateMapData).toHaveBeenCalled();
        // expect(component.showErrorMessage.entryError).toBe(false);
    });

    it('should show error if map title is empty in creation mode', () => {
        activatedRouteSpy.snapshot.params = { mode: Mode.Classic };
        component.mapTitle = '';

        component.saveMap();

        // expect(component.showErrorMessage.entryError).toBe(false);
    });

    it('should show error if map title is empty in edition mode', () => {
        activatedRouteSpy.snapshot.params = { id: '123' };
        component.mapTitle = '';

        component.saveMap();

        // expect(component.showErrorMessage.entryError).toBe(false);
    });

    it('should show error message', () => {
        const errorMessage = 'This is an error message';
        component.showError(errorMessage);
        expect(component.message).toBe(errorMessage);
    });
});
