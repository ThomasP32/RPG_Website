import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GameService } from '@app/services/game.service';
import { of, throwError } from 'rxjs';
import { CreateGameComponent } from './create-game.component';

describe('CreateGameComponent', () => {
    let component: CreateGameComponent;
    let fixture: ComponentFixture<CreateGameComponent>;
    let gameService: jasmine.SpyObj<GameService>;
    let router: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        gameService = jasmine.createSpyObj('GameService', ['getVisibleMaps', 'checkMapAvailability']);
        router = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [CreateGameComponent],
            providers: [
                { provide: GameService, useValue: gameService },
                { provide: Router, useValue: router },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CreateGameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load available maps', () => {
        const mockMaps = [
            { id: '1', name: 'Map 1', description: 'Adventurous game!', mapSize: 10, gameMode: 'mode1' },
            { id: '2', name: 'Map 2', description: 'Scary halloween game!', mapSize: 20, gameMode: 'mode2' },
        ];

        gameService.getVisibleMaps.and.returnValue(of(mockMaps));

        component.loadAvailableMaps();

        expect(gameService.getVisibleMaps).toHaveBeenCalled();
        expect(component.availableMaps).toEqual(mockMaps);
    });

    it('should navigate to create character page if map is available', () => {
        const mockMap = { id: '1', name: 'Map 1', description: 'Adventurous game!', mapSize: 10, gameMode: 'mode1' };
        gameService.checkMapAvailability.and.returnValue(of(true));

        component.selectMap(mockMap);

        expect(gameService.checkMapAvailability).toHaveBeenCalledWith(mockMap.id);
        expect(router.navigate).toHaveBeenCalledWith(['/create-character', mockMap.id]);
        expect(component.errorMessage).toBe('');
    });

    it('should set error message if map is unavailable', () => {
        const mockMap = { id: '1', name: 'Map 1', description: 'Adventurous game!', mapSize: 10, gameMode: 'mode1' };
        gameService.checkMapAvailability.and.returnValue(of(false));

        component.selectMap(mockMap);

        expect(gameService.checkMapAvailability).toHaveBeenCalledWith(mockMap.id);
        expect(component.errorMessage).toBe('The selected game is unavailable. Please choose another game.');
    });

    it('should handle error when loading maps', () => {
        gameService.getVisibleMaps.and.returnValue(throwError(() => new Error('Error loading maps')));

        component.loadAvailableMaps();

        expect(gameService.getVisibleMaps).toHaveBeenCalled();
        expect(component.availableMaps).toEqual([]);
        expect(component.errorMessage).toBe('Error loading maps');
    });
});
