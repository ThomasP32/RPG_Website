import { MapDto } from '@app/http/model/dto/map/map.dto';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { plainToClass, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Types } from 'mongoose';

describe('MapDto', () => {
    it('should validate successfully for a valid MapDto', async () => {
        const mapDto = {
            _id: new Types.ObjectId(),
            name: 'Updated Map',
            description: 'Updated description',
            imagePreview: 'http://example.com/updated-image.png',
            mode: Mode.Classic,
            mapSize: { x: 10, y: 10 },
            startTiles: [{ coordinate: { x: 0, y: 0 } }],
            items: [{ coordinate: { x: 1, y: 1 }, category: ItemCategory.Armor }],
            tiles: [{ coordinate: { x: 2, y: 2 }, category: TileCategory.Wall }],
            doorTiles: [{ coordinate: { x: 3, y: 3 }, isOpened: false }],
        };

        const dtoInstance = plainToInstance(MapDto, mapDto);
        const errors = await validate(dtoInstance);

        expect(errors.length).toBe(0);
    });

    it('should fail validation for invalid item category', async () => {
        const mapDto = {
            _id: new Types.ObjectId(),
            name: 'Invalid Item Category Map',
            description: 'This map has an invalid item category',
            imagePreview: 'http://example.com/invalid-item.png',
            mode: Mode.Classic,
            mapSize: { x: 10, y: 10 },
            startTiles: [{ coordinate: { x: 0, y: 0 } }],
            items: [{ coordinate: { x: 1, y: 1 }, category: 'InvalidCategory' }],
            tiles: [],
            doorTiles: [],
        };

        const dtoInstance = plainToClass(MapDto, mapDto);
        const errors = await validate(dtoInstance);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ property: 'items' })]));
    });

    it('should fail validation for invalid coordinate', async () => {
        const mapDto = {
            _id: new Types.ObjectId(),
            name: 'Invalid Item Category Map',
            description: 'This map has an invalid item category',
            imagePreview: 'http://example.com/invalid-item.png',
            mode: Mode.Classic,
            mapSize: { x: 'a', y: 10 },
            startTiles: [{ coordinate: { x: 0, y: 0 } }],
            items: [{ coordinate: { x: 1, y: 1 }, category: 'InvalidCategory' }],
            tiles: [],
            doorTiles: [],
        };

        const dtoInstance = plainToClass(MapDto, mapDto);
        const errors = await validate(dtoInstance);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ property: 'mapSize' })]));
    });
});
