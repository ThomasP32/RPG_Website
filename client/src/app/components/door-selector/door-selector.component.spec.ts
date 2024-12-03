import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { ImageService } from '@app/services/image/image.service';
import { Avatar } from '@common/game';
import { Cell, Door } from '@common/map-cell';
import { Coordinate, DoorTile, ItemCategory, TileCategory } from '@common/map.types';
import { DoorSelectorComponent } from './door-selector.component';

describe('DoorSelectorComponent', () => {
    let component: DoorSelectorComponent;
    let fixture: ComponentFixture<DoorSelectorComponent>;
    let imageService: jasmine.SpyObj<ImageService>;
    let gameTurnService: jasmine.SpyObj<GameTurnService>;

    beforeEach(async () => {
        const imageServiceSpy = jasmine.createSpyObj('ImageService', [
            'getDoorImage',
            'getTileImage',
            'getStartingPointImage',
            'getItemImage',
            'getPixelatedPlayerImage',
        ]);
        const gameTurnServiceSpy = jasmine.createSpyObj('GameTurnService', ['toggleDoor']);

        await TestBed.configureTestingModule({
            imports: [DoorSelectorComponent],
            providers: [
                { provide: ImageService, useValue: imageServiceSpy },
                { provide: GameTurnService, useValue: gameTurnServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(DoorSelectorComponent);
        component = fixture.componentInstance;
        imageService = TestBed.inject(ImageService) as jasmine.SpyObj<ImageService>;
        gameTurnService = TestBed.inject(GameTurnService) as jasmine.SpyObj<GameTurnService>;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit false when closeModal is called', () => {
        spyOn(component.showDoorSelectorChange, 'emit');
        component.closeModal();
        expect(component.showDoorSelectorChange.emit).toHaveBeenCalledWith(false);
    });

    it('should toggle door and emit false when onDoorClick is called with a valid coordinate', () => {
        const coordinate: Coordinate = { x: 1, y: 1 };
        const door: DoorTile = { coordinate, isOpened: false };
        component.surroundingMap = [
            [{ coordinate: { x: 0, y: 0 } } as Cell, { coordinate: { x: 0, y: 1 } } as Cell],
            [{ coordinate: { x: 1, y: 0 } } as Cell, { coordinate } as Cell],
        ];
        component.possibleDoors = [door];
        spyOn(component.showDoorSelectorChange, 'emit');

        component.onDoorClick(coordinate);

        expect(gameTurnService.toggleDoor).toHaveBeenCalledWith(door);
        expect(component.showDoorSelectorChange.emit).toHaveBeenCalledWith(false);
    });

    it('should return true if the coordinate is a door', () => {
        const coordinate: Coordinate = { x: 1, y: 1 };
        const door: DoorTile = { coordinate, isOpened: false };
        component.surroundingMap = [
            [{ coordinate: { x: 0, y: 0 } } as Cell, { coordinate: { x: 0, y: 1 } } as Cell],
            [{ coordinate: { x: 1, y: 0 } } as Cell, { coordinate } as Cell],
        ];
        component.possibleDoors = [door];

        const result = component.isDoor(coordinate);

        expect(result).toBeTrue();
    });

    it('should return the correct door image when getTileImage is called with a door tile', () => {
        const door: Door = { isDoor: true, isOpen: true };
        const coordinate: Coordinate = { x: 0, y: 1 };
        const isHovered = false;
        const isSelected = false;
        const isAccessible = true;
        const tileType = TileCategory.Door;
        component.surroundingMap = [
            [
                {
                    coordinate,
                    door,
                    isHovered,
                    isSelected,
                    isAccessible,
                    tileType,
                    isStartingPoint: false,
                    isOccupied: false,
                    alternateCoordinates: { x: 0, y: 0 },
                } as Cell,
            ],
        ];
        imageService.getDoorImage.and.returnValue('door-open-image');

        const result = component.getTileImage(TileCategory.Door, 0, 0);

        expect(result).toBe('door-open-image');
        expect(imageService.getDoorImage).toHaveBeenCalledWith(true);
    });

    it('should return the correct starting point image', () => {
        imageService.getStartingPointImage.and.returnValue('starting-point-image');

        const result = component.getStartingPointImage();

        expect(result).toBe('starting-point-image');
        expect(imageService.getStartingPointImage).toHaveBeenCalled();
    });

    it('should return the correct item image', () => {
        const item = ItemCategory.Armor;
        imageService.getItemImage.and.returnValue('item-image');

        const result = component.getItemImage(item);

        expect(result).toBe('item-image');
        expect(imageService.getItemImage).toHaveBeenCalledWith(item);
    });

    it('should return the correct avatar image', () => {
        const avatar = {} as Avatar;
        imageService.getPixelatedPlayerImage.and.returnValue('avatar-image');

        const result = component.getAvatarImage(avatar);

        expect(result).toBe('avatar-image');
        expect(imageService.getPixelatedPlayerImage).toHaveBeenCalledWith(avatar);
    });

    it('should return the correct row index', () => {
        const index = 1;
        const result = component.rowByIndex(index);
        expect(result).toBe(index);
    });

    it('should return the correct cell index', () => {
        const index = 1;
        const result = component.cellByIndex(index);
        expect(result).toBe(index);
    });
    it('should return the correct tile image when getTileImage is called with a non-door tile', () => {
        const tileType = TileCategory.Floor;
        const rowIndex = 0;
        const colIndex = 0;
        component.surroundingMap = [
            [
                {
                    coordinate: { x: 0, y: 0 },
                    door: { isDoor: false, isOpen: false },
                    tileType,
                } as Cell,
            ],
        ];
        imageService.getTileImage.and.returnValue('floor-image');

        const result = component.getTileImage(tileType, rowIndex, colIndex);

        expect(result).toBe('floor-image');
        expect(imageService.getTileImage).toHaveBeenCalledWith(tileType);
    });
});
