import { HttpResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Routes, provideRouter } from '@angular/router';
import { HomePageComponent } from '@app/pages/home-page/home-page.component';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { of } from 'rxjs';
import SpyObj = jasmine.SpyObj;

const routes: Routes = [];

describe('HomePageComponent', () => {
    let component: HomePageComponent;
    let fixture: ComponentFixture<HomePageComponent>;
    let mockSocketService: SpyObj<SocketService>;
    let communicationServiceSpy: SpyObj<CommunicationMapService>;

    beforeEach(async () => {
        mockSocketService = jasmine.createSpyObj('SocketService', ['connect', 'isSocketAlive', 'sendMessage']);
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['basicGet', 'basicPost']);
        communicationServiceSpy.basicGet.and.returnValue(of({ title: '', body: '' }));
        communicationServiceSpy.basicPost.and.returnValue(of(new HttpResponse<string>({ status: 201, statusText: 'Created' })));

        await TestBed.configureTestingModule({
            imports: [HomePageComponent],
            providers: [
                {
                    provide: CommunicationMapService,
                    useValue: communicationServiceSpy,
                },
                { provide: SocketService, useValue: mockSocketService },
                provideHttpClientTesting(),
                provideRouter(routes),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HomePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should display the game logo', () => {
        const logoElement = fixture.debugElement.nativeElement.querySelector('.game-logo');
        expect(logoElement).toBeTruthy();
    });

    it('should display the team number', () => {
        const teamNumberElement = fixture.debugElement.nativeElement.querySelector('.team-number');
        expect(teamNumberElement.textContent).toContain(component.teamNumber);
    });

    it('should display the developers', () => {
        const developersElement = fixture.debugElement.nativeElement.querySelector('.developers');
        expect(developersElement.textContent).toContain(component.developers.join(', '));
    });

    it('should call connect method on ngOnInit', () => {
        spyOn(component, 'connect');
        component.ngOnInit();
        expect(component.connect).toHaveBeenCalled();
    });

    it('should navigate to the create game view when navigateToCreateGame is called', () => {
        const routerSpy = spyOn(component['router'], 'navigate');
        component.navigateToCreateGame();
        expect(routerSpy).toHaveBeenCalledWith(['/create-game']);
    });

    it('should navigate to the admin page view when navigateToAdmin is called', () => {
        const routerSpy = spyOn(component['router'], 'navigate');
        component.navigateToAdmin();
        expect(routerSpy).toHaveBeenCalledWith(['/admin-page']);
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

    it('should show the join game modal when toggleJoinGameVisibility is called', () => {
        component.toggleJoinGameVisibility();
        expect(component.isJoinGameModalVisible).toBeTrue();
    });

    it('should hide the join game modal when onCloseModal is called', () => {
        component.isJoinGameModalVisible = true;
        component.onCloseModal();
        expect(component.isJoinGameModalVisible).toBeFalse();
    });
});
