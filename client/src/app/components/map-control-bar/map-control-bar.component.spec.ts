import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MapService } from '@app/services/map.service';
import { DBMap, Mode } from '@common/map.types';
import { Types } from 'mongoose';
import { MapControlBarComponent } from './map-control-bar.component';

describe('MapControlBarComponent', () => {
    let component: MapControlBarComponent;
    let fixture: ComponentFixture<MapControlBarComponent>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let routerSpy: jasmine.SpyObj<Router>;

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
        mapServiceSpy = jasmine.createSpyObj('MapService', ['resetMap', 'generateMapData']);
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

        expect(component.mode).toBe('classic');
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
        }, 2000);
    });
});

// describe('MapControlBarComponent', () => {
//     let component: MapControlBarComponent;
//     let fixture: ComponentFixture<MapControlBarComponent>;
//     let mapServiceSpy: jasmine.SpyObj<MapService>;
//     let mapGetServiceSpy: jasmine.SpyObj<MapGetService>;
//     let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;

//     const mapId = new Types.ObjectId().toString();
//     const mockMap: DBMap = {
//         _id: new Types.ObjectId(mapId),
//         name: 'Test Map',
//         description: 'This is a test map',
//         imagePreview: 'http://example.com/test.png',
//         mode: Mode.Classic,
//         mapSize: { x: 20, y: 20 },
//         startTiles: [{ coordinate: { x: 0, y: 0 } }],
//         items: [],
//         tiles: [],
//         doorTiles: [],
//         isVisible: true,
//         lastModified: new Date(),
//     };

//     beforeEach(async () => {
//         mapServiceSpy = jasmine.createSpyObj('MapService', [
//             'resetMap',
//             'saveNewMap',
//             'setMapTitle',
//             'setMapDescription',
//             'generateMapData',
//             'saveEditedMap',
//             'updateMap',
//         ]);
//         mapGetServiceSpy = jasmine.createSpyObj('MapGetService', ['map']);
//         activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', ['snapshot']);

//         await TestBed.configureTestingModule({
//             imports: [MapControlBarComponent],
//             providers: [
//                 { provide: MapService, useValue: mapServiceSpy },
//                 { provide: MapGetService, useValue: mapGetServiceSpy },
//                 { provide: ActivatedRoute, useValue: activatedRouteSpy },
//             ],
//         }).compileComponents();

//         fixture = TestBed.createComponent(MapControlBarComponent);
//         component = fixture.componentInstance;
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('should initialize in creation mode', () => {
//         activatedRouteSpy.snapshot.params = { mode: 'classic' };

//         component.ngOnInit();

//         expect(component.mode).toBe('classic');
//     });

//     it('should initialize in edition mode', () => {
//         activatedRouteSpy.snapshot.params = { id: '1' };
//         mapGetServiceSpy.map = mockMap;

//         component.ngOnInit();

//         expect(component.mapTitle).toBe(mockMap.name);
//         expect(component.mapDescription).toBe(mockMap.description);
//     });

//     it('should toggle edit title', () => {
//         component.toggleEditTitle();
//         expect(component.isEditingTitle).toBe(true);
//         component.toggleEditTitle();
//         expect(component.isEditingTitle).toBe(false);
//     });

//     it('should toggle edit description', () => {
//         component.toggleEditDescription();
//         expect(component.isEditingDescription).toBe(true);
//         component.toggleEditDescription();
//         expect(component.isEditingDescription).toBe(false);
//     });

//     it('should reset map', () => {
//         activatedRouteSpy.snapshot.params = { mode: Mode.Classic };
//         component.resetMap();
//         expect(mapServiceSpy.resetMap).toHaveBeenCalled();
//     });

//     it('should save map in creation mode', () => {
//         activatedRouteSpy.snapshot.params = { mode: Mode.Classic };
//         component.mapTitle = 'New Map';
//         component.mapDescription = 'New Description';

//         component.saveMap();

//         expect(mapServiceSpy.setMapTitle).toHaveBeenCalledWith('New Map');
//         expect(mapServiceSpy.setMapDescription).toHaveBeenCalledWith('New Description');
//         expect(mapServiceSpy.generateMapData).toHaveBeenCalled();
//         // expect(component.showErrorMessage.entryError).toBe(false);
//     });

//     it('should show error if map title is empty in creation mode', () => {
//         activatedRouteSpy.snapshot.params = { mode: Mode.Classic };
//         component.mapTitle = '';

//         component.saveMap();

//         // expect(component.showErrorMessage.entryError).toBe(false);
//     });

//     it('should show error if map title is empty in edition mode', () => {
//         activatedRouteSpy.snapshot.params = { id: '123' };
//         component.mapTitle = '';

//         component.saveMap();

//         // expect(component.showErrorMessage.entryError).toBe(false);
//     });

//     it('should show error message', () => {
//         const errorMessage = 'This is an error message';
//         component.showError(errorMessage);
//         expect(component.message).toBe(errorMessage);
//     });
// });
