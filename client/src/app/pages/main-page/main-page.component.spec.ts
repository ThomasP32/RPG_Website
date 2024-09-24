import { HttpResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Routes, provideRouter } from '@angular/router';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { CommunicationService } from '@app/services/communication.service';
import { of } from 'rxjs';
import SpyObj = jasmine.SpyObj;

const routes: Routes = [];

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let communicationServiceSpy: SpyObj<CommunicationService>;

    beforeEach(async () => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['basicGet', 'basicPost']);
        communicationServiceSpy.basicGet.and.returnValue(of({ title: '', body: '' }));
        communicationServiceSpy.basicPost.and.returnValue(of(new HttpResponse<string>({ status: 201, statusText: 'Created' })));

        await TestBed.configureTestingModule({
            imports: [MainPageComponent],
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
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it("should have as title 'Brassbound Realms'", () => {
        expect(component.title).toEqual('Brassbound Realms');
    });

    it('should display the game name in the header', () => {
        const titleElement = fixture.debugElement.nativeElement.querySelector('.header-item');
        expect(titleElement.textContent).toContain(component.title);
    });

    it('should display the game logo', () => {
        const logoElement = fixture.debugElement.nativeElement.querySelector('.game-logo');
        expect(logoElement.src).toContain(component.logoPath);
    });
    
    it('should display the team number', () => {
        const teamNumberElement = fixture.debugElement.nativeElement.querySelector('.team-number');
        expect(teamNumberElement.textContent).toContain(component.teamNumber);
    });

    it('should display the developers', () => {
        const developersElement = fixture.debugElement.nativeElement.querySelector('.developers');
        expect(developersElement.textContent).toContain(component.developers.join(', '));
    });

    it('should display a disabled "Rejoindre une Partie" button', () => {
        const joinGameButton = fixture.debugElement.nativeElement.querySelector('.disabled');
        expect(joinGameButton).toBeTruthy();
        expect(joinGameButton.disabled).toBeTrue();
    });

    it('should navigate to the game creation view when "Créer une partie" is clicked', () => {
        spyOn(component, 'navigateToCreateGame');
        const createGameButton = fixture.debugElement.nativeElement.querySelectorAll('.button')[0];
        createGameButton.click();
        expect(component.navigateToCreateGame).toHaveBeenCalled();
    });

    it('should navigate to the admin view when "Administration" is clicked', () => {
        spyOn(component, 'navigateToAdmin');
        const adminButton = fixture.debugElement.nativeElement.querySelectorAll('.button')[1];
        adminButton.click();
        expect(component.navigateToAdmin).toHaveBeenCalled();
    });

});
