import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MapAreaComponent } from '@app/components/map-creation/map-area/map-area.component';
import { ToolbarComponent } from '@app/components/toolbar/toolbar/toolbar.component';
import { GameCreationPageComponent } from './game-creation-page.component';

describe('GameCreationPageComponent', () => {
    let component: GameCreationPageComponent;
    let fixture: ComponentFixture<GameCreationPageComponent>;

    beforeEach(async () => {
        const mockToolbarComponent = {};

        const mockMapAreaComponent = {
            // Add any necessary properties or methods for interaction, if needed
        };

        await TestBed.configureTestingModule({
            declarations: [GameCreationPageComponent],
            providers: [
                { provide: ToolbarComponent, useValue: mockToolbarComponent },
                { provide: MapAreaComponent, useValue: mockMapAreaComponent },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameCreationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have initial selectedTile as "grass"', () => {
        expect(component.selectedTile).toBe('grass');
    });

    it('should update selectedTile on onTileSelected', () => {
        const newTile = 'water';
        component.onTileSelected(newTile);
        expect(component.selectedTile).toBe(newTile);
    });

    // Additional tests can be added to interact with child components:

    // it('should pass selectedTile to MapAreaComponent', () => {
    //     const mapAreaComponent = fixture.debugElement.query(By.directive(MapAreaComponent)).componentInstance;
    //     expect(mapAreaComponent.selectedTile).toBe(component.selectedTile);
    // });

    it('should handle tile selection from ToolbarComponent', () => {
        const toolbarComponent = fixture.debugElement.query(By.directive(ToolbarComponent)).componentInstance;
        const newTile = 'mountain';
        spyOn(component, 'onTileSelected'); // Spy on the method
        toolbarComponent.tileSelected.emit(newTile); // Simulate an event emission
        expect(component.onTileSelected).toHaveBeenCalledWith(newTile);
    });
});
