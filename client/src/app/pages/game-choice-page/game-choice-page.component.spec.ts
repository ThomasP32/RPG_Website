import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CommunicationMapService } from '@app/services/communication.map.service';
import { Map } from '@common/map.types';
import { of } from 'rxjs';
import { GameChoicePageComponent } from './game-choice-page.component';

import SpyObj = jasmine.SpyObj;

describe('GameChoicePageComponent', () => {
    let component: GameChoicePageComponent;
    let fixture: ComponentFixture<GameChoicePageComponent>;
    let mockRouter: SpyObj<Router>;
    let communicationMapServiceSpy: SpyObj<CommunicationMapService>;

    beforeEach(async () => {
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        communicationMapServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['getMapsFromServer', 'maps$']);
        communicationMapServiceSpy.maps$ = of([{ _id: '1', isVisible: true }] as Map[]);

        await TestBed.configureTestingModule({
            imports: [GameChoicePageComponent],
            providers: [
                { provide: Router, useValue: mockRouter },
                {
                    provide: CommunicationMapService,
                    useValue: communicationMapServiceSpy,
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameChoicePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should call getMapsFromServer on ngOnInit', () => {
        component.ngOnInit();
        expect(communicationMapServiceSpy.getMapsFromServer).toHaveBeenCalled();
    });

    it('should set selectedMap when selectMap is called', () => {
        const mapId = '1';
        component.selectMap(mapId);
        expect(component.selectedMap).toBe(mapId);
    });

    it('should navigate to create-character with map id when next is called and map is visible', () => {
        component.selectedMap = '1';
        component.next();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/create-character'], { queryParams: { id: '1' } });
    });

    it('should set userError to true when next is called and no map is selected', () => {
        component.selectedMap = undefined;
        component.next();
        expect(component.showErrorMessage.userError).toBeTrue();
    });

    it('should navigate to main menu when onReturn is called', () => {
        component.onReturn();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/mainmenu']);
    });
});
