// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { ActivatedRoute, Router } from '@angular/router';
// import { MapGetService } from '@app/services/map-get.service';
// import { MapService } from '@app/services/map.service';
// import { Map, Mode } from '@common/map.types';
// import { MapAreaComponent } from './map-area.component';

// describe('MapAreaComponent', () => {
//     let component: MapAreaComponent;
//     let fixture: ComponentFixture<MapAreaComponent>;
//     let mapServiceSpy: jasmine.SpyObj<MapService>;
//     let mapGetServiceSpy: jasmine.SpyObj<MapGetService>;
//     let routerSpy: jasmine.SpyObj<Router>;
//     let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;

//     const mockMap: Map = {
//         _id: '1',
//         name: 'Test Map',
//         isVisible: true,
//         mapSize: { x: 10, y: 10 },
//         startTiles: [],
//         items: [],
//         doorTiles: [],
//         tiles: [],
//         mode: Mode.Ctf,
//         description: '',
//         imagePreview: '',
//     };

//     beforeEach(async () => {
//         mapServiceSpy = jasmine.createSpyObj('MapService', ['updateStartingPointCounter', 'updateRandomItemCounter', 'updateItemsCounter']);
//         mapGetServiceSpy = jasmine.createSpyObj('MapGetService', ['map']);
//         routerSpy = jasmine.createSpyObj('Router', ['url']);
//         activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', ['snapshot']);

//         await TestBed.configureTestingModule({
//             imports: [MapAreaComponent],
//             providers: [
//                 { provide: MapService, useValue: mapServiceSpy },
//                 { provide: MapGetService, useValue: mapGetServiceSpy },
//                 { provide: Router, useValue: routerSpy },
//                 { provide: ActivatedRoute, useValue: activatedRouteSpy },
//             ],
//         }).compileComponents();

//         fixture = TestBed.createComponent(MapAreaComponent);
//         component = fixture.componentInstance;
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('should initialize map in creation mode', () => {
//         Object.defineProperty(routerSpy, 'url', { get: () => '/creation/size=10/:mode=ctf' });
//         activatedRouteSpy.snapshot.params = { size: '10', mode: 'ctf' };

//         component.ngOnInit();

//         expect(component.convertedMapSize).toBe(10);
//         expect(component.Map.length).toBe(10);
//         expect(component.Map[0].length).toBe(10);
//     });

//     it('should initialize map in edition mode', () => {
//         Object.defineProperty(routerSpy, 'url', { get: () => '/edition/123' });
//         mapGetServiceSpy.map = mockMap;

//         component.ngOnInit();

//         expect(component.map).toEqual(mockMap);
//         expect(component.convertedMapSize).toBe(10);
//     });

//     it('should place a tile', () => {
//         component.createMap(10);
//         component.selectedTile = 'wall';
//         component.placeTile(0, 0, false);
//         expect(component.Map[0][0].value).toBe('wall');
//     });

//     it('should erase a tile', () => {
//         component.createMap(10);
//         component.Map[0][0].value = 'wall';
//         component.placeTile(0, 0, true);
//         expect(component.Map[0][0].value).toBe('floor');
//     });

//     it('should place a starting point', () => {
//         component.createMap(10);
//         component.selectedTile = 'starting-point';
//         component.onDrop({ dataTransfer: new DataTransfer(), preventDefault: () => {} } as DragEvent, 0, 0);
//         expect(component.Map[0][0].item).toBe('starting-point');
//     });

//     it('should move a starting point', () => {
//         component.createMap(10);
//         component.Map[0][0].item = 'starting-point';
//         component.currentDraggedItem = { rowIndex: 0, colIndex: 0 };
//         component.onDrop({ dataTransfer: new DataTransfer(), preventDefault: () => {} } as DragEvent, 1, 1);
//         expect(component.Map[0][0].item).toBeUndefined();
//         expect(component.Map[1][1].item).toBe('starting-point');
//     });

//     it('should reset the map', () => {
//         component.createMap(10);
//         component.Map[0][0].value = 'wall';
//         component.resetMapToDefault();
//         expect(component.Map[0][0].value).toBe('floor');
//     });

//     it('should generate map data', () => {
//         component.createMap(10);
//         component.mapTitle = 'Generated Map';
//         component.mapDescription = 'This is a test map';
//         const mapData = component.generateMapData();

//         expect(mapData.name).toBe('Generated Map');
//         expect(mapData.description).toBe('This is a test map');
//         expect(mapData.mapSize.x).toBe(10);
//     });
// });
