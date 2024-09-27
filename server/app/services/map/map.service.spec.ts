import { Map, MapDocument, mapSchema } from '@app/model/schemas/map';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { Logger } from '@nestjs/common';
import { getConnectionToken, getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model, Types } from 'mongoose';
import { MapService } from './map.service';

/**
 * There is two way to test the service :
 * - Mock the mongoose Model implementation and do what ever we want to do with it (see describe CourseService) or
 * - Use mongodb memory server implementation (see describe CourseServiceEndToEnd) and let everything go through as if we had a real database
 *
 * The second method is generally better because it tests the database queries too.
 * We will use it more
 */

describe('MapService', () => {
    let service: MapService;
    let mapModel: Model<MapDocument>;

    beforeEach(async () => {
        // notice that only the functions we call from the model are mocked
        // we can´t use sinon because mongoose Model is an interface
        mapModel = {
            countDocuments: jest.fn(),
            insertMany: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            deleteOne: jest.fn(),
            update: jest.fn(),
            updateOne: jest.fn(),
        } as unknown as Model<MapDocument>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MapService,
                Logger,
                {
                    provide: getModelToken(Map.name),
                    useValue: mapModel,
                },
            ],
        }).compile();

        service = module.get<MapService>(MapService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('database should be populated when there is no data', async () => {
        jest.spyOn(mapModel, 'countDocuments').mockResolvedValue(0);
        const spyPopulateDB = jest.spyOn(service, 'populateDB');
        await service.start();
        expect(spyPopulateDB).toHaveBeenCalled();
    });

    it('database should not be populated when there is some data', async () => {
        jest.spyOn(mapModel, 'countDocuments').mockResolvedValue(1);
        const spyPopulateDB = jest.spyOn(service, 'populateDB');
        await service.start();
        expect(spyPopulateDB).not.toHaveBeenCalled();
    });
});

describe('MapServiceEndToEnd', () => {
    let service: MapService;
    let mapModel: Model<MapDocument>;
    let mongoServer: MongoMemoryServer;
    let connection: Connection;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        // notice that only the functions we call from the model are mocked
        // we can´t use sinon because mongoose Model is an interface
        const module = await Test.createTestingModule({
            imports: [
                MongooseModule.forRootAsync({
                    useFactory: () => ({
                        uri: mongoServer.getUri(),
                    }),
                }),
                MongooseModule.forFeature([{ name: Map.name, schema: mapSchema }]),
            ],
            providers: [MapService, Logger],
        }).compile();

        service = module.get<MapService>(MapService);
        mapModel = module.get<Model<MapDocument>>(getModelToken(Map.name));
        connection = await module.get(getConnectionToken());
    });

    afterEach(async () => {
        await mapModel.deleteMany({});
    });

    afterAll(async () => {
        await connection.close();
        await mongoServer.stop({ doCleanup: true });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
        expect(mapModel).toBeDefined();
    });

    it('start() should populate the database when there is no data', async () => {
        const spyPopulateDB = jest.spyOn(service, 'populateDB');
        await mapModel.deleteMany({});
        await service.start();
        expect(spyPopulateDB).toHaveBeenCalled();
    });

    it('populateDB() should add 1 new map', async () => {
        const eltCountsBefore = await mapModel.countDocuments();
        await service.populateDB();
        const eltCountsAfter = await mapModel.countDocuments();
        expect(eltCountsAfter).toBeGreaterThan(eltCountsBefore);
    });

    it('getAllVisibleMaps() return only visible maps in database', async () => {
        await mapModel.create(getFakeMap());
        await mapModel.create(getFakeMap2());
        expect((await service.getAllVisibleMaps()).length).toEqual(1);
    });

    it('getMapByName() return map with the specified name only if visible', async () => {
        const map = getFakeMap();
        map.isVisible = false;
        await mapModel.create(map);
        await expect(service.getMapByName(map.name)).rejects.toThrow(`Failed to find visible map : ${map.name}`);
    });

    it('getMapByName() return visible map with the specified name', async () => {
        const map = getFakeMap();
        map.isVisible = true;
        await mapModel.create(map);
        const result = await service.getMapByName(map.name);
        expect(result).toBeTruthy();
        expect(result.name).toEqual(map.name);
        expect(result.isVisible).toBe(true);
    });

    it('getMapByName() should fail if map does not exist', async () => {
        const map = getFakeMap();
        await expect(service.getMapByName(map.name)).rejects.toBeTruthy();
    });

    const getFakeMap = (): Map => ({
        _id: new Types.ObjectId('507f191e810c19729de860ea'),
        name: 'Test de jeu',
        isVisible: false,
        description: getRandomString(),
        imagePreview: getRandomString(),
        mode: getRandomEnumValue(Mode),
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: getRandomNumberBetween(0, 9), y: getRandomNumberBetween(0, 9) } }],
        items: [{ coordinate: { x: getRandomNumberBetween(0, 9), y: getRandomNumberBetween(0, 9) }, category: getRandomEnumValue(ItemCategory) }],
        tiles: [{ coordinate: { x: getRandomNumberBetween(0, 9), y: getRandomNumberBetween(0, 9) }, category: getRandomEnumValue(TileCategory) }],
        doorTiles: [{ coordinate: { x: getRandomNumberBetween(0, 9), y: getRandomNumberBetween(0, 9) }, isOpened: true }],
    });

    const getFakeMap2 = (): Map => ({
        name: 'Test',
        isVisible: true,
        description: getRandomString(),
        imagePreview: getRandomString(),
        mode: getRandomEnumValue(Mode),
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: getRandomNumberBetween(0, 9), y: getRandomNumberBetween(0, 9) } }],
        items: [{ coordinate: { x: getRandomNumberBetween(0, 9), y: getRandomNumberBetween(0, 9) }, category: getRandomEnumValue(ItemCategory) }],
        tiles: [{ coordinate: { x: getRandomNumberBetween(0, 9), y: getRandomNumberBetween(0, 9) }, category: getRandomEnumValue(TileCategory) }],
        doorTiles: [{ coordinate: { x: getRandomNumberBetween(0, 9), y: getRandomNumberBetween(0, 9) }, isOpened: true }],
    });

    const BASE_36 = 36;
    const getRandomString = (): string => (Math.random() + 1).toString(BASE_36).substring(2);

    function getRandomEnumValue<T>(enumObj: T): T[keyof T] {
        const enumValues = Object.values(enumObj) as T[keyof T][];
        const randomIndex = Math.floor(Math.random() * enumValues.length);
        return enumValues[randomIndex];
    }

    function getRandomNumberBetween(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
});
