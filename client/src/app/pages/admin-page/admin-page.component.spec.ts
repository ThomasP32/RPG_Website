import { HttpResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Routes, provideRouter } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { CommunicationService } from '@app/services/communication.service';
import { of } from 'rxjs';
import SpyObj = jasmine.SpyObj;

const routes: Routes = [];

describe('MainPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;
    let communicationServiceSpy: SpyObj<CommunicationService>;

    beforeEach(async () => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['getGames', 'deleteGame', 'updateGame']);
        communicationServiceSpy.getMapsFromServer.and.returnValue(of([{ name: 'Game 1', mapSize: { x: 100, y: 100 }, isVisible: true }]));

        await TestBed.configureTestingModule({
            imports: [AdminPageComponent],
            providers: [
                {
                    provide: CommunicationService,
                    useValue: communicationServiceSpy,
                },
                provideHttpClientTesting(),
                provideRouter(routes),
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

    it('should display the admin title', () => {
        const titleElement = fixture.debugElement.nativeElement.querySelector('.header-item');
        expect(titleElement.textContent).toContain('Administration des maps');
    });

    it('should navigate to the main page when "Retour" is clicked', () => {
        spyOn(component, 'navigateToMain');
        const backButton = fixture.debugElement.nativeElement.querySelector('.button');
        backButton.click();
        expect(component.navigateToMain).toHaveBeenCalled();
    });

    it('should display the list of available games', () => {
        const mapItems = fixture.debugElement.nativeElement.querySelectorAll('.map-item');
        expect(mapItems.length).toBeGreaterThan(0); 
    });
    
    it('should display game details', () => {
        const mapItem = fixture.debugElement.nativeElement.querySelector('.map-item');
        const mapName = mapItem.querySelector('.map-name').textContent;
        const mapSize = mapItem.querySelectorAll('.map-details')[0].textContent;
        const visibility = mapItem.querySelectorAll('.map-details')[2].textContent;

        expect(mapName).toContain('Game 1');  
        expect(mapSize).toContain('100 x 100');
        expect(mapLastModified).toContain('Last modified: ');
        expect(visibility).toContain('Public');  
    });

    it('should toggle the visibility of a game', () => {
        spyOn(component, 'toggleVisibility');
        const toggleVisibilityButton = fixture.debugElement.nativeElement.querySelector('.map-actions button');
        toggleVisibilityButton.click();
        expect(component.toggleVisibility).toHaveBeenCalled();
    });

    it('should navigate to the game edition view when "Edit" is clicked', () => {
        spyOn(component, 'editGame');
        const editButton = fixture.debugElement.nativeElement.querySelector('.map-actions a');
        editButton.click();
        expect(component.editGame).toHaveBeenCalled();
    });

    it('should navigate to the game creation view when "Start New Game" is clicked', () => {
        spyOn(component, 'navigateToCreateGame');
        const startNewGameButton = fixture.debugElement.nativeElement.querySelectorAll('.button')[1];
        startNewGameButton.click();
        expect(component.navigateToCreateGame).toHaveBeenCalled();
    });

    it('should delete a game when delete button is clicked', () => {
        spyOn(component, 'deleteGame');
        const deleteButton = fixture.debugElement.nativeElement.querySelector('.map-actions button');
        deleteButton.click();
        expect(component.deleteGame).toHaveBeenCalled();
    });

    it('should display the game description on hover', () => {
        const previewImage = fixture.debugElement.nativeElement.querySelector('.map-description');
        previewImage.dispatchEvent(new Event('mouseover'));
        fixture.detectChanges();
        expect(previewImage.textContent).toContain('description to be added to server on hover');
    });

});
