import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { CharacterService } from '@app/services/character.service';
import { of, Subject } from 'rxjs';
import { CreateCharacterComponent } from './create-character.component';

import SpyObj = jasmine.SpyObj;

describe('CreateCharacterComponent', () => {
    let component: CreateCharacterComponent;
    let fixture: ComponentFixture<CreateCharacterComponent>;
    let mockCharacterService: SpyObj<CharacterService>;
    let mockRouter: SpyObj<Router>;
    let mockActivatedRoute: { queryParams: Subject<any> };

    beforeEach(async () => {
        mockCharacterService = jasmine.createSpyObj('CharacterService', ['getCharacters']);
        mockCharacterService.getCharacters.and.returnValue(of([]));
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockActivatedRoute = { queryParams: new Subject() };

        await TestBed.configureTestingModule({
            imports: [CreateCharacterComponent],
            providers: [
                { provide: CharacterService, useValue: mockCharacterService },
                { provide: Router, useValue: mockRouter },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CreateCharacterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create CreateCharacterComponent', () => {
        expect(component).toBeTruthy();
    });

    // it('should load characters on initialization', () => {
    //     const mockCharacters = [{ name: 'Character 1' }, { name: 'Character 2' }];
    //     mockCharacterService.getCharacters.and.returnValue(of(mockCharacters));
    //     component.loadCharacters();
    //     expect(component.characters).toEqual(mockCharacters);
    // });

    it('should apply life bonus when lifeOrSpeedBonus is life', () => {
        component.lifeOrSpeedBonus = 'life';
        component.addBonus();
        expect(component.life).toBe(6);
        expect(component.speed).toBe(4);
    });

    it('should apply speed bonus when lifeOrSpeedBonus is speed', () => {
        component.lifeOrSpeedBonus = 'speed';
        component.addBonus();
        expect(component.life).toBe(4);
        expect(component.speed).toBe(6);
    });

    it('should get URL parameters and set mapId correctly', () => {
        mockActivatedRoute.queryParams.next({ id: '123' });
        component.ngOnInit();
        expect(component.mapId).toBe('123');
    });

    it('should convert URL params', () => {
        spyOn(component, 'urlConverter');
        component.urlConverter('mapId=123');
        expect(component.convertedId).toBe('123');
    });

    it('should not set convertedId if mapId is empty', () => {
        component.urlConverter('');
        expect(component.convertedId).toBe('');
    });

    it('should navigate to waiting-room on submit', () => {
        component.onSubmit();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/waiting-room']);
    });
});
