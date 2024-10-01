import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapSize, NbItems } from '@app/interfaces/map-choices';
import { Mode } from '@common/map.types';
import { MapComponent } from './map.component';

describe('MapComponent', () => {
    let component: MapComponent;
    let fixture: ComponentFixture<MapComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MapComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should convert size to MapSize and NbItems', () => {
        component.sizeConversion('small');
        expect(component.mapSize).toBe(MapSize.Small);
        expect(component.nbItems).toBe(NbItems.Small);

        component.sizeConversion('medium');
        expect(component.mapSize).toBe(MapSize.Medium);
        expect(component.nbItems).toBe(NbItems.Medium);

        component.sizeConversion('large');
        expect(component.mapSize).toBe(MapSize.Large);
        expect(component.nbItems).toBe(NbItems.Large);
    });

    // it('should redirect to edit view with correct params', () => {
    //     const originalLocation = window.location;

    //     const mockLocation = {
    //         href: 'http://localhost:4200/mock-route',
    //         assign: jasmine.createSpy('assign'),
    //     };

    //     Object.defineProperty(window, 'location', {
    //         writable: true,
    //         value: mockLocation,
    //     });

    //     component.mapSize = MapSize.Medium;
    //     component.selectedMode = 'classic';
    //     component.redirectToEditView();
    //     expect(mockLocation.assign).toHaveBeenCalledWith(`/creation/size=15/:mode=classic`);

    //     // component.mapSize = MapSize.Small;
    //     // component.selectedMode = 'ctf';
    //     // component.redirectToEditView();
    //     // expect(mockLocation.assign).toHaveBeenCalledWith(`/creation/size=10/:mode=ctf`);

    //     window.location = originalLocation;
    // });

    it('should set error message if no mode selected', () => {
        component.mapSize = MapSize.Large;
        component.selectedMode = undefined;
        component.redirectToEditView();
        expect(component.showErrorMessage).toBe(true);
    });

    it('should set error message if no map size selected', () => {
        component.mapSize = undefined;
        component.selectedMode = Mode.Classic;
        component.redirectToEditView();
        expect(component.showErrorMessage).toBe(true);
    });

    it('should set selected mode', () => {
        const mode = 'classic';
        component.onModeSelected(mode);
        expect(component.selectedMode).toBe(mode);
    });

    it('should emit close event', () => {
        spyOn(component.closeChoices, 'emit');
        component.closeComponent();
        expect(component.closeChoices.emit).toHaveBeenCalled();
    });
});
