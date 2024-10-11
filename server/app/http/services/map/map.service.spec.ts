import { MapDocument, mapSchema } from '@app/http/model/schemas/map/map.schema';
import { ItemCategory, Map, Mode, TileCategory } from '@common/map.types';
import { getConnectionToken, getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { MapService } from './map.service';

const RANDOM_NUMBER_END = 9;

describe('MapService', () => {
    let service: MapService;
    let mapModel: Model<MapDocument>;

    beforeEach(async () => {
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
});

describe('MapServiceEndToEnd', () => {
    let service: MapService;
    let mapModel: Model<MapDocument>;
    let mongoServer: MongoMemoryServer;
    let connection: Connection;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const module = await Test.createTestingModule({
            imports: [
                MongooseModule.forRootAsync({
                    useFactory: () => ({
                        uri: mongoServer.getUri(),
                    }),
                }),
                MongooseModule.forFeature([{ name: Map.name, schema: mapSchema }]),
            ],
            providers: [MapService],
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

    it('getAllVisibleMaps() return only visible maps in database', async () => {
        await mapModel.create(getFakeMap());
        const map2 = await mapModel.create(getFakeMap2());

        await mapModel.findByIdAndUpdate(map2._id, { isVisible: true });

        const visibleMaps = await service.getAllVisibleMaps();
        expect(visibleMaps.length).toEqual(1);
        expect(visibleMaps[0].name).toEqual(map2.name);
    });

    it('getMapByName() return map with the specified name only if visible', async () => {
        const map = await mapModel.create(getFakeMap());
        await expect(service.getMapByName(map.name)).rejects.toThrow(`Failed to find visible map : ${map.name}`);
    });

    it('getMapByName() return visible map with the specified name', async () => {
        const map = await mapModel.create(getFakeMap());
        await mapModel.findByIdAndUpdate(map._id, { isVisible: true });
        const result = await service.getMapByName(map.name);
        expect(result).toBeTruthy();
        expect(result.name).toEqual(map.name);
    });

    it('getMapByName() should fail if map does not exist', async () => {
        const map = getFakeMap();
        await expect(service.getMapByName(map.name)).rejects.toBeTruthy();
    });

    const getFakeMap = (): Map => ({
        name: 'Test de jeu',
        description: getRandomString(),
        imagePreview: getRandomString(),
        mode: getRandomEnumValue(Mode),
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: getRandomNumberBetween(0, RANDOM_NUMBER_END), y: getRandomNumberBetween(0, RANDOM_NUMBER_END) } }],
        items: [
            {
                coordinate: { x: getRandomNumberBetween(0, RANDOM_NUMBER_END), y: getRandomNumberBetween(0, RANDOM_NUMBER_END) },
                category: getRandomEnumValue(ItemCategory),
            },
        ],
        tiles: [
            {
                coordinate: { x: getRandomNumberBetween(0, RANDOM_NUMBER_END), y: getRandomNumberBetween(0, RANDOM_NUMBER_END) },
                category: getRandomEnumValue(TileCategory),
            },
        ],
        doorTiles: [
            { coordinate: { x: getRandomNumberBetween(0, RANDOM_NUMBER_END), y: getRandomNumberBetween(0, RANDOM_NUMBER_END) }, isOpened: true },
        ],
    });

    const getFakeMap2 = (): Map => ({
        name: 'Test',
        description: getRandomString(),
        imagePreview: getRandomString(),
        mode: getRandomEnumValue(Mode),
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: getRandomNumberBetween(0, RANDOM_NUMBER_END), y: getRandomNumberBetween(0, RANDOM_NUMBER_END) } }],
        items: [
            {
                coordinate: { x: getRandomNumberBetween(0, RANDOM_NUMBER_END), y: getRandomNumberBetween(0, RANDOM_NUMBER_END) },
                category: getRandomEnumValue(ItemCategory),
            },
        ],
        tiles: [
            {
                coordinate: { x: getRandomNumberBetween(0, RANDOM_NUMBER_END), y: getRandomNumberBetween(0, RANDOM_NUMBER_END) },
                category: getRandomEnumValue(TileCategory),
            },
        ],
        doorTiles: [
            { coordinate: { x: getRandomNumberBetween(0, RANDOM_NUMBER_END), y: getRandomNumberBetween(0, RANDOM_NUMBER_END) }, isOpened: true },
        ],
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
