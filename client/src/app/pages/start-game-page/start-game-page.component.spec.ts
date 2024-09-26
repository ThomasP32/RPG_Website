import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Routes, provideRouter } from '@angular/router';
import { CommunicationMapService } from '@app/services/communication.map.service';
import { Map } from '@common/map.types';
import { of } from 'rxjs';
import { StartGamePageComponent } from './start-game-page.component';

import SpyObj = jasmine.SpyObj;

const routes: Routes = [];

describe('StartGamePageComponent', () => {
    let component: StartGamePageComponent;
    let fixture: ComponentFixture<StartGamePageComponent>;
    let communicationMapServiceSpy: SpyObj<CommunicationMapService>;
    let mockMaps: Map[];

    beforeEach(async () => {
        mockMaps = [
            { _id: '1', name: 'Map 1', isVisible: true, mapSize: { x: 10, y: 10 }, startTiles: [], items: [], doorTiles: [], tiles: [] },
            { _id: '2', name: 'Map 2', isVisible: false, mapSize: { x: 10, y: 10 }, startTiles: [], items: [], doorTiles: [], tiles: [] },
        ];

        communicationMapServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['getMapsFromServer', 'maps$']);

        communicationMapServiceSpy.maps$ = of(mockMaps);

        await TestBed.configureTestingModule({
            imports: [StartGamePageComponent],
            providers: [
                {
                    provide: CommunicationMapService,
                    useValue: communicationMapServiceSpy,
                },
                provideRouter(routes),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(StartGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with maps from the service', () => {
        expect(component.maps).toEqual(mockMaps);
    });

    it('should set the selectedMap when selectMap is called', () => {
        component.selectMap('1');
        expect(component.selectedMap).toBe('1');
    });

    it('should navigate to create-character page when a valid map is selected in next()', () => {
        spyOn(component, 'next');
        const mockHref = window.location.href;
        Object.defineProperty(window, 'location', {
            value: {
                href: '',
                assign: function (newHref: string) {
                    this.href = newHref;
                },
            },
            writable: true,
        });
        component.selectMap('1');
        component.next('1');

        expect(component.showErrorMessage.selectionError).toBeFalse();
        expect(component.showErrorMessage.userError).toBeFalse();
        expect(window.location.href).toContain(`/create-character/?id=1`);

        Object.defineProperty(window, 'location', { value: mockHref });
    });

    it('should show selectionError when an invalid map is selected in next()', () => {
        component.selectMap('3');
        component.next('3');

        expect(component.showErrorMessage.selectionError).toBeTrue();
        expect(component.showErrorMessage.userError).toBeFalse();
    });

    it('should show userError when no map is selected in next()', () => {
        component.selectedMap = '';
        component.next('');

        expect(component.showErrorMessage.selectionError).toBeFalse();
        expect(component.showErrorMessage.userError).toBeTrue();
    });

    it('should display the correct error message when selectionError is true', () => {
        component.showErrorMessage.selectionError = true;
        fixture.detectChanges();

        const errorElement: HTMLElement = fixture.nativeElement.querySelector('.error-message');
        expect(errorElement).toBeTruthy();
        expect(errorElement.textContent).toContain('Error : The selected game is no longer available.');
    });

    it('should display the correct error message when userError is true', () => {
        component.showErrorMessage.userError = true;
        fixture.detectChanges();

        const errorElement: HTMLElement = fixture.nativeElement.querySelector('.error-message');
        expect(errorElement).toBeTruthy();
        expect(errorElement.textContent).toContain('Error : No game was selected. Please select a game.');
    });
});
