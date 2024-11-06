import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageService } from '@app/services/image/image.service';
import { Avatar, Game, Player } from '@common/game';
import { Coordinate, ItemCategory, TileCategory } from '@common/map.types';
import { GameMapComponent } from './game-map.component';

describe('GameMapComponent', () => {
    let component: GameMapComponent;
    let fixture: ComponentFixture<GameMapComponent>;
    let imageServiceSpy: jasmine.SpyObj<ImageService>;

    beforeEach(async () => {
        const imageServiceMock = jasmine.createSpyObj('ImageService', [
            'getTileImage',
            'getItemImage',
            'getPlayerImage',
            'getStartingPointImage',
            'getPixelatedPlayerImage',
        ]);
        await TestBed.configureTestingModule({
            imports: [GameMapComponent],
            providers: [{ provide: ImageService, useValue: imageServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapComponent);
        component = fixture.componentInstance;
        imageServiceSpy = TestBed.inject(ImageService) as jasmine.SpyObj<ImageService>;

        component.loadedMap = {
            id: 'game-id',
            mapSize: { x: 10, y: 10 },
            tiles: [
                { coordinate: { x: 2, y: 2 }, category: TileCategory.Water },
                { coordinate: { x: 3, y: 3 }, category: TileCategory.Ice },
                { coordinate: { x: 4, y: 4 }, category: TileCategory.Wall },
            ],
            doorTiles: [
                { coordinate: { x: 1, y: 2 }, isOpened: false },
                { coordinate: { x: 2, y: 1 }, isOpened: true },
            ],
            startTiles: [{ coordinate: { x: 0, y: 0 } }],
            items: [{ coordinate: { x: 0, y: 1 }, category: ItemCategory.Hat }],
            players: [{ position: { x: 2, y: 2 }, avatar: Avatar.Avatar1 } as Player],
        } as Game;

        component.moves = new Map<string, { path: Coordinate[]; weight: number }>();
        fixture.detectChanges();
    });
    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('#ngOnInit', () => {
        it('should initialize and load map data', () => {
            spyOn(component, 'loadMap');
            const mockMap = component.loadedMap;

            component.ngOnInit();

            expect(component.loadMap).toHaveBeenCalledWith(mockMap);
        });
    });

    describe('#onTileClick', () => {
        it('should not emit tileClicked event when clicking on an invalid move tile', () => {
            spyOn(component.tileClicked, 'emit');
            const position: Coordinate = { x: 3, y: 3 };
            component.onTileClick(position);
            expect(component.tileClicked.emit).not.toHaveBeenCalled();
        });

        it('should emit tileClicked event when clicking on a valid move tile', () => {
            spyOn(component.tileClicked, 'emit');
            const position: Coordinate = { x: 1, y: 1 };
            component.moves.set('1,1', { path: [], weight: 1 });
            component.onTileClick(position);
            expect(component.tileClicked.emit).toHaveBeenCalledWith(position);
        });
    });

    describe('#onTileHover', () => {
        it('should clear move preview when hovering over an invalid move tile', () => {
            const position: Coordinate = { x: 0, y: 0 };
            spyOn(component, 'clearPreview');
            component.onTileHover(position);
            expect(component.clearPreview).toHaveBeenCalled();
        });

        it('should set movePreview when hovering over a valid move tile', () => {
            const position: Coordinate = { x: 1, y: 1 };
            const path = [{ x: 1, y: 1 }, { x: 1, y: 2 }];
            component.moves.set('1,1', { path, weight: 1 }); 
            component.onTileHover(position);
            expect(component.movePreview).toEqual(path);
        });
    
    });

    describe('#onRightClickTile', () => {
        it('should display tile description on right-click for different tile categories', () => {
            const event = new MouseEvent('contextmenu', { button: 2 });
            const waterTile = { x: 2, y: 2 };
            const iceTile = { x: 3, y: 3 };
            const wallTile = { x: 4, y: 4 };

            component.onRightClickTile(event, waterTile);
            expect(component.tileDescription).toBe("Un déplacement sur une tuile d'eau nécessite 2 points de mouvements.");

            component.onRightClickTile(event, iceTile);
            expect(component.tileDescription).toBe(
                "Un déplacement sur une tuile de glace ne nécessite aucun point de mouvement, mais a un risque de chute qui s'élève à 10%.",
            );

            component.onRightClickTile(event, wallTile);
            expect(component.tileDescription).toBe("Aucun déplacement n'est possible sur ou à travers un mur.");
        });

        it('should display correct description for a closed door tile on right-click', () => {
            const event = new MouseEvent('contextmenu', { button: 2 });
            const closedDoorPosition: Coordinate = { x: 1, y: 2 };

            component.onRightClickTile(event, closedDoorPosition);

            expect(component.tileDescription).toBe('Une porte fermée ne peut être franchie, mais peut être ouverte par une action.');
            expect(component.explanationIsVisible).toBeTrue();
        });

        it('should display correct description for an open door tile on right-click', () => {
            const event = new MouseEvent('contextmenu', { button: 2 });
            const openDoorPosition: Coordinate = { x: 2, y: 1 };

            component.onRightClickTile(event, openDoorPosition);

            expect(component.tileDescription).toBe('Une porte ouverte peut être franchie, mais peut être fermée par une action.');
            expect(component.explanationIsVisible).toBeTrue();
        });
    });
    describe('#clearPreview', () => {
        it('should clear move preview', () => {
            component.movePreview = [
                { x: 1, y: 1 },
                { x: 2, y: 2 },
            ];

            component.clearPreview();

            expect(component.movePreview).toEqual([]);
        });
    });

    describe('#isMove', () => {
        it('should return false if the tile is not a valid move tile', () => {
            expect(component.isMove(0, 0)).toBeFalse();
        });
    });


    describe('#isPreview', () => {
        it('should return true if the tile is in move preview', () => {
            component.movePreview = [{ x: 1, y: 1 }];
            expect(component.isPreview(1, 1)).toBeTrue();
        });

        it('should return false if the tile is not in move preview', () => {
            component.movePreview = [{ x: 1, y: 1 }];
            expect(component.isPreview(2, 2)).toBeFalse();
        });
    });

    describe('#getTileImage', () => {
        it('should get tile image from image service', () => {
            imageServiceSpy.getTileImage.and.returnValue('tile-image');
            const image = component.getTileImage(TileCategory.Floor, 1, 1);
            expect(imageServiceSpy.getTileImage).toHaveBeenCalledWith(TileCategory.Floor, 1, 1, component.map);
            expect(image).toBe('tile-image');
        });
    });

    describe('#getItemImage', () => {
        it('should get item image from image service', () => {
            imageServiceSpy.getItemImage.and.returnValue('item-image');
            const image = component.getItemImage(ItemCategory.Hat);
            expect(imageServiceSpy.getItemImage).toHaveBeenCalledWith(ItemCategory.Hat);
            expect(image).toBe('item-image');
        });
    });

    describe('#onRightClickRelease', () => {
        it('should hide tile description when right-click is released', () => {
            const event = new MouseEvent('mouseup', { button: 2 });
            component.onRightClickRelease(event);
            expect(component.explanationIsVisible).toBeFalse();
            expect(component.tileDescription).toBe('');
        });
    });
});
