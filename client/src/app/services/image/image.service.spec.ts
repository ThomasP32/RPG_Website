import { TestBed } from '@angular/core/testing';
import { Avatar } from '@common/game';
import { Cell } from '@common/map-cell';
import { ItemCategory, TileCategory } from '@common/map.types';
import { ImageService } from './image.service';

describe('ImageService', () => {
    let service: ImageService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ImageService],
        });
        service = TestBed.inject(ImageService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should load tile image', () => {
        expect(service.loadTileImage('door')).toBe('./assets/tiles/door_closed.jpg');
        expect(service.loadTileImage('wall')).toBe('./assets/tiles/wall.png');
        expect(service.loadTileImage('ice')).toBe('./assets/tiles/ice1.jpg');
        expect(service.loadTileImage('water')).toBe('./assets/tiles/water.png');
        expect(service.loadTileImage('invalid')).toBe('');
    });

    it('should get tile image', () => {
        const mockMap: Cell[][] = [
            [
                {
                    tileType: TileCategory.Door,
                    door: { isOpen: true, isDoor: true },
                    coordinate: { x: 0, y: 0 },
                    isStartingPoint: false,
                    isOccupied: false,
                    isHovered: false,
                },
            ],
            [
                {
                    tileType: TileCategory.Door,
                    door: { isOpen: false, isDoor: true },
                    coordinate: { x: 1, y: 0 },
                    isStartingPoint: false,
                    isOccupied: false,
                    isHovered: false,
                },
            ],
        ];
        expect(service.getTileImage(TileCategory.Door, 0, 0, mockMap)).toBe('./assets/tiles/door_opened.jpg');
        expect(service.getTileImage(TileCategory.Door, 1, 0, mockMap)).toBe('./assets/tiles/door_closed.jpg');
        expect(service.getTileImage(TileCategory.Wall, 0, 0, mockMap)).toBe('./assets/tiles/wall.png');
        expect(service.getTileImage(TileCategory.Ice, 0, 0, mockMap)).toBe('./assets/tiles/ice1.jpg');
        expect(service.getTileImage(TileCategory.Water, 0, 0, mockMap)).toBe('./assets/tiles/water.png');
        expect(service.getTileImage(TileCategory.Floor, 0, 0, mockMap)).toBe('./assets/tiles/floor.png');
    });

    it('should get item image', () => {
        expect(service.getItemImage(ItemCategory.Vest)).toBe('./assets/items/vest.png');
        expect(service.getItemImage(ItemCategory.Mask)).toBe('./assets/items/mask.png');
        expect(service.getItemImage(ItemCategory.Jar)).toBe('./assets/items/jar.png');
        expect(service.getItemImage(ItemCategory.Acidgun)).toBe('./assets/items/acidgun.png');
        expect(service.getItemImage(ItemCategory.Key)).toBe('./assets/items/keysilver.png');
        expect(service.getItemImage(ItemCategory.Hat)).toBe('./assets/items/hat.png');
        expect(service.getItemImage(ItemCategory.Random)).toBe('./assets/items/randomchest.png');
    });

    it('should get player image', () => {
        expect(service.getPlayerImage(Avatar.Avatar1)).toBe('./assets/characters/1.png');
        expect(service.getPlayerImage(Avatar.Avatar2)).toBe('./assets/characters/2.png');
        expect(service.getPlayerImage(Avatar.Avatar3)).toBe('./assets/characters/3.png');
        expect(service.getPlayerImage(Avatar.Avatar4)).toBe('./assets/characters/4.png');
        expect(service.getPlayerImage(Avatar.Avatar5)).toBe('./assets/characters/5.png');
        expect(service.getPlayerImage(Avatar.Avatar6)).toBe('./assets/characters/6.png');
        expect(service.getPlayerImage(Avatar.Avatar7)).toBe('./assets/characters/7.png');
        expect(service.getPlayerImage(Avatar.Avatar8)).toBe('./assets/characters/8.png');
        expect(service.getPlayerImage(Avatar.Avatar9)).toBe('./assets/characters/9.png');
        expect(service.getPlayerImage(Avatar.Avatar10)).toBe('./assets/characters/10.png');
        expect(service.getPlayerImage(Avatar.Avatar11)).toBe('./assets/characters/11.png');
        expect(service.getPlayerImage(Avatar.Avatar12)).toBe('./assets/characters/12.png');
        expect(service.getPlayerImage({} as Avatar)).toBe('');
    });

    it('should get item image by string', () => {
        expect(service.getItemImageByString('vest')).toBe('./assets/items/vest.png');
        expect(service.getItemImageByString('mask')).toBe('./assets/items/mask.png');
        expect(service.getItemImageByString('jar')).toBe('./assets/items/jar.png');
        expect(service.getItemImageByString('acidgun')).toBe('./assets/items/acidgun.png');
        expect(service.getItemImageByString('key')).toBe('./assets/items/keysilver.png');
        expect(service.getItemImageByString('hat')).toBe('./assets/items/hat.png');
        expect(service.getItemImageByString('random')).toBe('./assets/items/randomchest.png');
        expect(service.getItemImageByString('invalid')).toBe('');
    });

    it('should get pixelated player image', () => {
        expect(service.getPixelatedPlayerImage(Avatar.Avatar1)).toBe('./assets/pixelcharacters/1.png');
        expect(service.getPixelatedPlayerImage(Avatar.Avatar2)).toBe('./assets/pixelcharacters/2.png');
        expect(service.getPixelatedPlayerImage(Avatar.Avatar3)).toBe('./assets/pixelcharacters/3.png');
        expect(service.getPixelatedPlayerImage(Avatar.Avatar4)).toBe('./assets/pixelcharacters/4.png');
        expect(service.getPixelatedPlayerImage(Avatar.Avatar5)).toBe('./assets/pixelcharacters/5.png');
        expect(service.getPixelatedPlayerImage(Avatar.Avatar6)).toBe('./assets/pixelcharacters/6.png');
        expect(service.getPixelatedPlayerImage(Avatar.Avatar7)).toBe('./assets/pixelcharacters/7.png');
        expect(service.getPixelatedPlayerImage(Avatar.Avatar8)).toBe('./assets/pixelcharacters/8.png');
        expect(service.getPixelatedPlayerImage(Avatar.Avatar9)).toBe('./assets/pixelcharacters/9.png');
        expect(service.getPixelatedPlayerImage(Avatar.Avatar10)).toBe('./assets/pixelcharacters/10.png');
        expect(service.getPixelatedPlayerImage(Avatar.Avatar11)).toBe('./assets/pixelcharacters/11.png');
        expect(service.getPixelatedPlayerImage(Avatar.Avatar12)).toBe('./assets/pixelcharacters/12.png');
        expect(service.getPixelatedPlayerImage({} as Avatar)).toBe('');
    });
});