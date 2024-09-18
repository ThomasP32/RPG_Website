import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs'; // For simulating ActivatedRoute observables
import { MapAreaComponent } from './map-area.component';

describe('MapAreaComponent', () => {
    let component: MapAreaComponent;
    let fixture: ComponentFixture<MapAreaComponent>;

    beforeEach(async () => {
        // Mock the ActivatedRoute to simulate URL parameters
        const mockActivatedRoute = {
            queryParams: of({}), // Empty queryParams initially
            snapshot: { params: {} }, // Empty params initially
        };

        await TestBed.configureTestingModule({
            imports: [CommonModule, MapAreaComponent],
            providers: [{ provide: ActivatedRoute, useValue: mockActivatedRoute }],
        }).compileComponents();

        fixture = TestBed.createComponent(MapAreaComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default values', () => {
        expect(component.selectedTile).toBe('grass');
        expect(component.isPlacing).toBe(false);
        expect(component.defaultTile).toBe('grass');
    });

    it('should create a map on init', fakeAsync(() => {
        const mockActivatedRoute = TestBed.inject(ActivatedRoute);
        (mockActivatedRoute.snapshot.params as any)['size'] = 'size=5'; // Simulate URL param
        component.ngOnInit();
        tick();

        expect(component.convertedMapSize).toBe(5);
        expect(component.Map.length).toBe(5);
        expect(component.Map[0].length).toBe(5);
        expect(component.Map[0][0].value).toBe('grass');
    }));

    it('should select a tile', () => {
        spyOn(console, 'log');
        component.selectTile('wall');
        expect(component.selectedTile).toBe('wall');
        expect(console.log).toHaveBeenCalledWith('Selected tile:', 'wall');
    });
    // ... (Other imports and setup from the previous test suite)

    it('should start placing tiles and place the selected tile', () => {
        component.selectedTile = 'wall'; // Set a tile to be placed
        component.createMap(3, 'edit'); // Create a small map for testing

        component.startPlacingTile(1, 1);

        expect(component.isPlacing).toBe(true); // isPlacing should be true
        expect(component.Map[1][1].value).toBe('wall'); // The tile should be placed
    });

    it('should stop placing tiles', () => {
        component.isPlacing = true; // Simulate placing mode

        component.stopPlacingTile();

        expect(component.isPlacing).toBe(false); // isPlacing should be false
    });

    it('should place a tile', () => {
        component.selectedTile = 'wall';
        component.createMap(3, 'edit'); // Create a small map for testing
        component.placeTile(1, 1);
        expect(component.Map[1][1].value).toBe('wall');
    });

    it('should not place a tile if it is the same as the existing tile', () => {
        component.selectedTile = 'grass';
        component.createMap(3, 'edit');
        component.placeTile(0, 0);
        expect(component.Map[0][0].value).toBe('grass'); // Should remain unchanged
    });

    it('should get the correct tile image', () => {
        expect(component.getTileImage('grass')).toBe('../../../../assets/tiles/wood.png');
        expect(component.getTileImage('wall')).toBe('../../../../assets/tiles/wall.png');
        expect(component.getTileImage('ice')).toBe('../../../../assets/tiles/iceacid.png');
        expect(component.getTileImage('water')).toBe('../../../../assets/tiles/acid.png');
        expect(component.getTileImage('invalid')).toBe('../../../../assets/tiles/wood.png');
    });

    it('should convert URL params', () => {
        spyOn(console, 'log');
        component.urlConverter('size=10');
        expect(component.convertedMapSize).toBe(10);
        expect(console.log).toHaveBeenCalledWith('URL params:', 'size=10');
        expect(console.log).toHaveBeenCalledWith('Converted map size:', 10);
    });
});
