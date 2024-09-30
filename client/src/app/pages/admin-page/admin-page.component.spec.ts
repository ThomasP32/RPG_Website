import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { DBMap as Map, Mode } from '@common/map.types';
import { Router } from '@angular/router';
import SpyObj = jasmine.SpyObj;

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
        tiles: []
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
        tiles: []
    },
];

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let router: SpyObj<Router>;
    let fixture: ComponentFixture<AdminPageComponent>;
    let communicationServiceSpy: SpyObj<CommunicationMapService>;

    beforeEach(async () => {
        router = jasmine.createSpyObj('Router', ['navigate']);
        communicationServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['basicGet']);

        await TestBed.configureTestingModule({
            imports: [AdminPageComponent, CommonModule],
            providers: [
                { provide: Router, useValue: router },
                {
                    provide: CommunicationMapService,
                    useValue: communicationServiceSpy,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
      });

      it('should call basicGet on ngOnInit and populate the maps', () => {
        component.ngOnInit();
        communicationServiceSpy.basicGet.and.returnValue(of(mockMaps));
        expect(communicationServiceSpy.basicGet).toHaveBeenCalledWith('admin');
        communicationServiceSpy.basicGet.and.returnValue(of(mockMaps));
        expect(component.maps).toEqual(mockMaps);
      });

    it('should display the admin title', () => {
        const titleElement = fixture.debugElement.nativeElement.querySelector('.header-item');
        expect(titleElement.textContent).toContain('Administration des maps');
    });

    it('should navigate to the main page when "Retour" is clicked', () => {
        component.navigateToMain();
        expect(router.navigate).toHaveBeenCalledWith(['/main-menu']);
    });

    it('should display the list of available games', () => {
        fixture.detectChanges(); 
        const mapItems = fixture.debugElement.nativeElement.querySelectorAll('.map-item');
        expect(mapItems.length).toBeGreaterThan(0); 
    });
    
    it('should display game details', () => {
        const mapItem = fixture.debugElement.nativeElement.querySelector('.map-item');
        const mapName = mapItem.querySelector('.map-name').textContent;
        const mapSize = mapItem.querySelectorAll('.map-details')[0].textContent;
        const mapMode = mapItem.querySelectorAll('.map-details')[1].textContent;
        const lastModified = mapItem.querySelectorAll('.map-details')[2].textContent;
        const visibility = mapItem.querySelectorAll('.map-details')[3].textContent;
        // const description = mapItem.querySelector('.map-description').textContent;

        expect(mapName).toContain('Game 1');  
        expect(mapSize).toContain('100 x 100');
        expect(mapMode).toContain('Mode: CTF');
        expect(lastModified).toContain('Last modified: 2024-09-30 8:03');
        expect(visibility).toContain('Visible');  
    });

    it('should toggle the visibility of a game', () => {
        spyOn(component, 'toggleVisibility');
        const toggleVisibilityButton = fixture.debugElement.nativeElement.querySelector('.map-actions button');
        toggleVisibilityButton.click();
        expect(component.toggleVisibility).toHaveBeenCalled();
    });

    it ('should display the game creation modal when "Créer un jeu" is clicked', () => {
        spyOn(component, 'toggleGameCreationModalVisibility');
        const createGameButton = fixture.debugElement.nativeElement.querySelector('.button');
        createGameButton.click();
        expect(component.toggleGameCreationModalVisibility).toHaveBeenCalled();
    });

    it ('should close the game creation modal when "Fermer" is clicked', () => {
        spyOn(component, 'onCloseModal');
        const closeButton = fixture.debugElement.nativeElement.querySelector('.modal-close');
        closeButton.click();
        expect(component.onCloseModal).toHaveBeenCalled();
    });

    it ('should display the preview image for each map', () => {
        const previewImage = fixture.debugElement.nativeElement.querySelector('.map-preview');
        expect(previewImage).toBeTruthy();
    });

    it('should navigate to the map edition view when "Edit" is clicked', () => {
        spyOn(component, 'editMap');
        const editButton = fixture.debugElement.nativeElement.querySelector('.map-actions a');
        editButton.click();
        expect(component.editMap).toHaveBeenCalled();
    });

    it('should delete a map when delete button is clicked', () => {
        spyOn(component, 'deleteMap');
        const deleteButton = fixture.debugElement.nativeElement.querySelector('.map-actions button');
        deleteButton.click();
        expect(component.deleteMap).toHaveBeenCalled();
    });

    // it('should display the game description on hover', () => {
    //     const previewImage = fixture.debugElement.nativeElement.querySelector('.map-description');
    //     previewImage.dispatchEvent(new Event('mouseover'));
    //     fixture.detectChanges();
    //     expect(previewImage.textContent).toContain('description to be added to server on hover');
    // });

});
