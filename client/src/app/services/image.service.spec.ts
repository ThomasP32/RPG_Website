import { TestBed } from '@angular/core/testing';
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
        expect(service.loadTileImage('door')).toBe('../../../../assets/tiles/door_y.png');
        expect(service.loadTileImage('wall')).toBe('../../../../assets/tiles/wall.png');
        expect(service.loadTileImage('ice')).toBe('../../../../assets/tiles/ice1.jpg');
        expect(service.loadTileImage('water')).toBe('../../../../assets/tiles/water.png');
        expect(service.loadTileImage('invalid')).toBe('');
    });

    it('should get tile image', () => {
        const mockMap = [[{ value: 'door', doorState: 'closed' }], [{ value: 'door', doorState: 'open' }]];
        expect(service.getTileImage('door', 0, 0, mockMap)).toBe('../../../../assets/tiles/door_y.png');
        expect(service.getTileImage('door', 1, 0, mockMap)).toBe('../../../../assets/tiles/door_x.png');
        expect(service.getTileImage('wall', 0, 0, mockMap)).toBe('../../../../assets/tiles/wall.png');
        expect(service.getTileImage('ice', 0, 0, mockMap)).toBe('../../../../assets/tiles/ice1.jpg');
        expect(service.getTileImage('water', 0, 0, mockMap)).toBe('../../../../assets/tiles/water.png');
        expect(service.getTileImage('floor', 0, 0, mockMap)).toBe('../../../../assets/tiles/floor.png');
    });

    it('should get item image', () => {
        expect(service.getItemImage('vest')).toBe('../../../../assets/items/vest.png');
        expect(service.getItemImage('mask')).toBe('../../../../assets/items/mask.png');
        expect(service.getItemImage('jar')).toBe('../../../../assets/items/jar.png');
        expect(service.getItemImage('acidgun')).toBe('../../../../assets/items/acidgun.png');
        expect(service.getItemImage('key')).toBe('../../../../assets/items/keysilver.png');
        expect(service.getItemImage('hat')).toBe('../../../../assets/items/hat.png');
        expect(service.getItemImage('random')).toBe('../../../../assets/items/randomchest.png');
        expect(service.getItemImage('starting-point')).toBe('../../../../assets/tiles/startingpoint.png');
        expect(service.getItemImage('invalid')).toBe('');
    });
});
