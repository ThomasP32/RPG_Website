import { Test, TestingModule } from '@nestjs/testing';
import { MapController } from '@app/http/controllers/map/map.controller';
import { MapService } from '@app/http/services/map/map.service';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';

const HTTP_NOT_FOUND = 404;
const HTTP_OK = 200;

describe('MapController', () => {
    let app: INestApplication;

    const mockMap = {
        _id: '507f191e810c19729de860ea',
        name: 'Test Map',
        description: 'This is a test map',
        imagePreview: 'http://example.com/image.png',
        mode: 'Test Mode',
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: 0, y: 0 } }],
        items: [{ coordinate: { x: 1, y: 0 }, category: 'Test Category' }],
        tiles: [{ coordinate: { x: 1, y: 1 }, category: 'Wall' }],
        doorTiles: [{ coordinate: { x: 1, y: 2 }, isOpened: true }],
    };

    const mockMapService = {
        getAllVisibleMaps: jest.fn().mockResolvedValue([mockMap]),
        getMapByName: jest.fn().mockImplementation(async (name) => {
            if (name === mockMap.name) {
                return Promise.resolve(mockMap);
            } else {
                return Promise.reject(new NotFoundException('Map not found'));
            }
        }),
    };

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MapController],
            providers: [
                {
                    provide: MapService,
                    useValue: mockMapService,
                },
            ],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET / should return all visible maps', async () => {
        return request(app.getHttpServer())
            .get('/map/')
            .expect(HTTP_OK)
            .expect([{ ...mockMap, _id: mockMap._id.toString() }]);
    });

    it('GET /:mapName should return a map by name', async () => {
        return request(app.getHttpServer())
            .get(`/map/${mockMap.name}`)
            .expect(HTTP_OK)
            .expect({ ...mockMap, _id: mockMap._id.toString() });
    });

    it('GET /:mapName should return HTTP_NOT_FOUND if map is not found', async () => {
        return request(app.getHttpServer()).get('/map/unknown-map').expect(HTTP_NOT_FOUND);
    });
});
