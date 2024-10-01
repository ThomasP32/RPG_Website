/* eslint-disable */
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { DBMap as Map, Mode } from '@common/map.types';
import { of, throwError } from 'rxjs';
import { AdminPageComponent } from './admin-page.component';

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;
    let communicationMapService: jasmine.SpyObj<CommunicationMapService>;
    let router: Router;

    const mockMaps: Map[] = [
        {
            _id: '1',
            isVisible: true,
            name: 'Map1',
            description: 'Description1',
            imagePreview: 'image1.png',
            mode: Mode.Ctf,
            mapSize: { x: 1, y: 1 },
            lastModified: new Date(),
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
        },
        {
            _id: '2',
            isVisible: true,
            name: 'Map2',
            description: 'Description2',
            imagePreview: 'image2.png',
            mode: Mode.Normal,
            mapSize: { x: 2, y: 2 },
            lastModified: new Date(),
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
        },
    ];

    beforeEach(async () => {
        // Create a spy for CommunicationMapService
        const communicationMapServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['basicGet', 'basicDelete', 'basicPatch']);

        await TestBed.configureTestingModule({
            imports: [RouterTestingModule.withRoutes([]), AdminPageComponent],
            providers: [{ provide: CommunicationMapService, useValue: communicationMapServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        communicationMapService = TestBed.inject(CommunicationMapService) as jasmine.SpyObj<CommunicationMapService>;
        router = TestBed.inject(Router);

        const mockResponse = new HttpResponse<string>({
            status: 200,
            statusText: 'OK',
            body: 'Success',
        });

        communicationMapService.basicGet.and.returnValue(of(mockMaps));
        communicationMapService.basicDelete.and.returnValue(of(mockResponse));
        communicationMapService.basicPatch.and.returnValue(of(mockResponse));

        fixture.detectChanges(); // Trigger initial data binding and ngOnInit
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should handle error when deleting a map fails', () => {
        const errorMessage = 'Failed to delete map';
        const mockError = new HttpErrorResponse({
            status: 500,
            error: JSON.stringify({ message: errorMessage }),
        });

        spyOn(component.errorMessageModal, 'open');
        communicationMapService.basicDelete.and.returnValue(throwError(() => mockError));

        component.deleteMap('1');

        expect(component.errorMessageModal.open).toHaveBeenCalledWith(errorMessage);
    });

    it('should set isMapVisible to true when toggleGameCreationModalVisibility is called', () => {
        expect(component.isCreateMapModalVisible).toBe(false);
        component.toggleGameCreationModalVisibility();
        expect(component.isCreateMapModalVisible).toBe(true);
    });

    it('should set isMapVisible to false when onCloseModal is called', () => {
        component.isCreateMapModalVisible = true;
        expect(component.isCreateMapModalVisible).toBe(true);
        component.onCloseModal();
        expect(component.isCreateMapModalVisible).toBe(false);
    });

    it('should fetch maps on initialization', () => {
        expect(communicationMapService.basicGet).toHaveBeenCalledWith('admin');
        expect(component.maps.length).toBe(2);
        expect(component.maps).toEqual(mockMaps);
    });

    it('should display the correct number of maps', () => {
        fixture.detectChanges();
        const mapElements = fixture.debugElement.queryAll(By.css('.map-card'));
        expect(mapElements.length).toBe(2);
    });

    it('should open and close delete confirmation modal', () => {
        component.openConfirmationModal(mockMaps[0]);
        expect(component.showDeleteModal).toBeTrue();
        expect(component.currentMapId).toBe('1');

        component.closeDeleteModal();
        expect(component.showDeleteModal).toBeFalse();
        expect(component.currentMapId).toBeNull();
    });

    it('should confirm deletion of a map and close the modal', () => {
        const mapIdToDelete = '1';
        spyOn(component, 'deleteMap').and.callThrough();
        spyOn(component, 'closeDeleteModal').and.callThrough();
        component.confirmDelete(mapIdToDelete);
        expect(component.deleteMap).toHaveBeenCalledWith(mapIdToDelete);
        expect(component.closeDeleteModal).toHaveBeenCalled();
    });

    it('should toggle the map visibility', () => {
        component.toggleVisibility('1');
        expect(communicationMapService.basicPatch).toHaveBeenCalledWith('admin/1');
    });

    it('should navigate to the main menu', () => {
        spyOn(router, 'navigate');
        component.navigateToMain();
        expect(router.navigate).toHaveBeenCalledWith(['/main-menu']);
    });
});
