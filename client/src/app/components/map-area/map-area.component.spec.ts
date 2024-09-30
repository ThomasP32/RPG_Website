// import { CommonModule } from '@angular/common';
// import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
// import { ActivatedRoute } from '@angular/router';
// import { of } from 'rxjs';
// import { MapAreaComponent } from './map-area.component';

// describe('MapAreaComponent', () => {
//     let component: MapAreaComponent;
//     let fixture: ComponentFixture<MapAreaComponent>;

//     beforeEach(async () => {
//         const mockActivatedRoute = {
//             queryParams: of({}),
//             snapshot: { params: {} },
//         };

//         await TestBed.configureTestingModule({
//             imports: [CommonModule, MapAreaComponent],
//             providers: [{ provide: ActivatedRoute, useValue: mockActivatedRoute }],
//         }).compileComponents();

//         fixture = TestBed.createComponent(MapAreaComponent);
//         component = fixture.componentInstance;
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('should have default values', () => {
//         expect(component.selectedTile).toBe('floor');
//         expect(component.isPlacing).toBe(false);
//         expect(component.isErasing).toBe(false);
//         expect(component.defaultTile).toBe('floor');
//     });

//     it('should create a map on init', fakeAsync(() => {
//         const mockActivatedRoute = TestBed.inject(ActivatedRoute);
//         (mockActivatedRoute.snapshot.params as any)['size'] = 'size=5';
//         component.ngOnInit();
//         tick();

//         expect(component.convertedMapSize).toBe(5);
//         expect(component.Map.length).toBe(5);
//         expect(component.Map[0].length).toBe(5);
//         expect(component.Map[0][0].value).toBe('grass');
//     }));

//     it('should select a tile', () => {
//         spyOn(console, 'log');
//         component.selectTile('wall');
//         expect(component.selectedTile).toBe('wall');
//         expect(console.log).toHaveBeenCalledWith('Selected tile:', 'wall');
//     });

//     it('should start placing tiles with left-click and place the selected tile', () => {
//         component.selectedTile = 'wall';
//         component.createMap(3, 'edit');

//         component.startPlacingTile(1, 1, false);

//         expect(component.isPlacing).toBe(true);
//         expect(component.Map[1][1].value).toBe('wall');
//     });

//     it('should start erasing tiles with right-click and replace with default tile', () => {
//         component.selectedTile = 'wall';
//         component.createMap(3, 'edit');

//         component.startPlacingTile(1, 1, false);
//         expect(component.Map[1][1].value).toBe('wall');

//         component.startPlacingTile(1, 1, true);

//         expect(component.isErasing).toBe(true);
//         expect(component.Map[1][1].value).toBe('floor');
//     });

//     it('should stop placing and erasing tiles', () => {
//         component.isPlacing = true;
//         component.isErasing = true;

//         component.stopPlacingTile();

//         expect(component.isPlacing).toBe(false);
//         expect(component.isErasing).toBe(false);
//     });

//     it('should place a door tile and toggle between open and closed states', () => {
//         component.selectedTile = 'door';
//         component.createMap(3, 'edit');

//         // Place a closed door first
//         component.placeTile(1, 1, false);
//         expect(component.Map[1][1].value).toBe('door');
//         expect(component.Map[1][1].doorState).toBe('closed');

//         // Click again to toggle to open
//         component.placeTile(1, 1, false);
//         expect(component.Map[1][1].doorState).toBe('open');

//         // Click again to toggle back to closed
//         component.placeTile(1, 1, false);
//         expect(component.Map[1][1].doorState).toBe('closed');
//     });

//     it('should place a tile with left-click', () => {
//         component.selectedTile = 'wall';
//         component.createMap(3, 'edit');
//         component.placeTile(1, 1, false);
//         expect(component.Map[1][1].value).toBe('wall');
//     });

//     it('should replace a tile with the default tile on right-click', () => {
//         component.createMap(3, 'edit');
//         component.Map[1][1].value = 'wall';
//         component.placeTile(1, 1, true);
//         expect(component.Map[1][1].value).toBe('floor');
//     });

//     it('should not place a tile if it is the same as the existing tile', () => {
//         component.selectedTile = 'grass';
//         component.createMap(3, 'edit');
//         component.placeTile(0, 0, false);
//         expect(component.Map[0][0].value).toBe('grass');
//     });

//     it('should get the correct tile image', () => {
//         expect(component.getTileImage('floor', 0, 0)).toBe('../../../../assets/tiles/floor.png');
//         expect(component.getTileImage('wall', 0, 0)).toBe('../../../../assets/tiles/wall.png');
//         expect(component.getTileImage('ice', 0, 0)).toBe('../../../../assets/tiles/ice.png');
//         expect(component.getTileImage('water', 0, 0)).toBe('../../../../assets/tiles/water.png');
//         expect(component.getTileImage('door', 1, 1)).toBe('../../../../assets/tiles/door_y.png');

//         // Simulate door open state
//         component.Map[1][1].doorState = 'open';
//         expect(component.getTileImage('door', 1, 1)).toBe('../../../../assets/tiles/door_x.png');
//     });

//     it('should convert URL params', () => {
//         spyOn(console, 'log');
//         component.urlConverter('size=10');
//         expect(component.convertedMapSize).toBe(10);
//         expect(console.log).toHaveBeenCalledWith('URL params:', 'size=10');
//         expect(console.log).toHaveBeenCalledWith('Converted map size:', 10);
//     });

//     it('should reset the map to default tile', () => {
//         component.createMap(3, 'edit');
//         component.Map[1][1].value = 'wall';
//         component.resetMapToDefault();
//         expect(component.Map[1][1].value).toBe(component.defaultTile);
//     });
// });
