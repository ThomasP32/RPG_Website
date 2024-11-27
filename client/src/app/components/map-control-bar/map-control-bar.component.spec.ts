import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MapService } from '@app/services/map/map.service';
import { DetailedMap, Mode } from '@common/map.types';
import { Types } from 'mongoose';
import { MapControlBarComponent } from './map-control-bar.component';

describe('MapControlBarComponent', () => {
    let component: MapControlBarComponent;
    let fixture: ComponentFixture<MapControlBarComponent>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let routerSpy: jasmine.SpyObj<Router>;

    const mapId = new Types.ObjectId().toString();
    const mockMap: DetailedMap = {
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
        mapServiceSpy = jasmine.createSpyObj('MapService', ['resetMap', 'generateMap']);
        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', ['snapshot'], {
            snapshot: { params: { mode: 'classic' } },
        });
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [MapControlBarComponent],
            providers: [
                { provide: MapService, useValue: mapServiceSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MapControlBarComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize in creation mode and set title and description to empty', () => {
        activatedRouteSpy.snapshot.params = { mode: 'classic' };
        component.ngOnInit();

        expect(component.title).toBe('');
        expect(component.description).toBe('');
    });

    it('should initialize in edition mode and set title and description from mapService', () => {
        activatedRouteSpy.snapshot.params = { id: '1' };
        mapServiceSpy.map = mockMap;
        component.ngOnInit();

        expect(component.title).toBe(mockMap.name);
        expect(component.description).toBe(mockMap.description);
    });

    it('should toggle editing mode', () => {
        component.editMode = true;
        component.toggleEditing();
        expect(component.editMode).toBe(false);
        component.toggleEditing();
        expect(component.editMode).toBe(true);
    });

    it('should reset map', () => {
        component.resetMap();
        expect(mapServiceSpy.resetMap).toHaveBeenCalled();
    });

    it('should save map when title and description are valid', () => {
        mapServiceSpy.map = mockMap;
        component.title = 'New Map';
        component.description = 'New Description';

        component.saveMap();

        expect(mapServiceSpy.map.name).toBe('New Map');
        expect(mapServiceSpy.map.description).toBe('New Description');
        expect(mapServiceSpy.generateMap).toHaveBeenCalled();
    });

    it('should show error message if title or description is empty', () => {
        component.title = '';
        component.description = 'Description';

        component.saveMap();

        expect(component.message).toBe("Le titre et la description ne peuvent pas être vides ou composés uniquement d'espaces.");

        component.title = 'Title';
        component.description = '';

        component.saveMap();

        expect(component.message).toBe("Le titre et la description ne peuvent pas être vides ou composés uniquement d'espaces.");
    });

    it('should navigate back to admin page', () => {
        component.back();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin-page']);
    });

    it('should show success message and navigate after timeLimit', (done) => {
        const successMessage = 'Votre jeu a été sauvegardé avec succès!';
        component.showError(successMessage);

        expect(component.message).toBe(successMessage);

        setTimeout(() => {
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin-page']);
            done();
        }, 3000);
    });
});
