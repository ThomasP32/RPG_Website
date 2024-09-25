import { Map, MapDocument, mapSchema } from '@app/model/database/map';
import { CreateMapDto } from '@app/model/dto/map/create-map.dto';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { Logger } from '@nestjs/common';
import { getConnectionToken, getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
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

    it('getAllMaps() return all maps in database', async () => {
        const map = getFakeMap();
        await mapModel.create(map);
        expect((await service.getAllMaps()).length).toBeGreaterThan(0);
    });

    // it('getMapById() return map with the specified id', async () => {
    //     const map = getFakeMap();
    //     await mapModel.create(map);
    //     expect(await service.getMapById(map._id)).toEqual(expect.objectContaining(map));
    // });

    it('getMapByName() return map with the specified name', async () => {
        const map = getFakeMap();
        await mapModel.create(map);
        expect(await service.getMapByName(map.name)).toMatchObject(map);
    });

    // it('getMapById() should fail if map does not exist', async () => {
    //     const map = getFakeMap();
    //     await expect(service.getMapByName(map._id)).rejects.toBeTruthy();
    // });

    it('getMapByName() should fail if map does not exist', async () => {
        const map = getFakeMap();
        await expect(service.getMapByName(map.name)).rejects.toBeTruthy();
    });

    // it('modifyCourse() should fail if course does not exist', async () => {
    //     const course = getFakeCourse();
    //     await expect(service.modifyCourse(course)).rejects.toBeTruthy();
    // });

    // it('modifyCourse() should fail if mongo query failed', async () => {
    //     jest.spyOn(courseModel, 'updateOne').mockRejectedValue('');
    //     const course = getFakeCourse();
    //     await expect(service.modifyCourse(course)).rejects.toBeTruthy();
    // });

    // it('getCoursesByTeacher() return course with the specified teacher', async () => {
    //     const course = getFakeCourse();
    //     await courseModel.create(course);
    //     await courseModel.create(course);
    //     const courses = await service.getCoursesByTeacher(course.teacher);
    //     expect(courses.length).toEqual(2);
    //     expect(courses[0]).toEqual(expect.objectContaining(course));
    // });

    it('deleteMap() should delete the course with specified name', async () => {
        const map = getFakeMap();
        await mapModel.create(map);
        await service.deleteMap(map.name);
        expect(await mapModel.countDocuments()).toEqual(0);
    });

    it('deleteMap() should fail if the course does not exist', async () => {
        const map = getFakeMap();
        await expect(service.deleteMap(map.name)).rejects.toBeTruthy();
    });

    it('deleteMap() should fail if mongo query failed', async () => {
        jest.spyOn(mapModel, 'deleteOne').mockRejectedValue('');
        const map = getFakeMap();
        await expect(service.deleteMap(map.name)).rejects.toBeTruthy();
    });

    it('addMap() should add the map to the DB', async () => {
        const map = getFakeMapDto();
        await service.addMap(map);
        expect(await service.getMapByName(map.name)).toMatchObject(map);
    });

    it('addMap() should fail if mongo query failed', async () => {
        jest.spyOn(mapModel, 'create').mockImplementation(async () => Promise.reject(''));
        const map = getFakeMapDto();
        await expect(service.addMap(map)).rejects.toBeTruthy();
    });

    it('should throw error when start tiles are not placed', async () => {
        await expect(service.addMap(getFakeInvalidMapDto())).rejects.toThrow('All start tiles must be placed');
    });

    it('should throw error when doors are not free', async () => {
        await expect(service.addMap(getFakeInvalidMapDto2())).rejects.toThrow('All doors must be free');
    });

    it('should throw error when map name already exists', async () => {
        await service.start();
        await expect(service.addMap(getFakeInvalidMapDto3())).rejects.toThrow('A map with this name already exists');
    });

    it('should throw error when elements are out of bounds', async () => {
        await expect(service.addMap(getFakeInvalidMapDto4())).rejects.toThrow('All elements must be inside map');
    });

    it('should throw error when there are isolated ground tiles', async () => {
        await expect(service.addMap(getFakeInvalidMapDto5())).rejects.toThrow('Map must not have any isolated ground tile');
    });

    it('should throw error when less than 50% are grass tiles', async () => {
        await expect(service.addMap(getFakeInvalidMapDto6())).rejects.toThrow('Map must contain more than 50% of grass tiles');
    });
});

const getFakeMap = (): Map => ({
    name: getRandomString(),
    description: getRandomString(),
    imagePreview: getRandomString(),
    mode: getRandomEnumValue(Mode),
    mapSize: { x: 10, y: 10 },
    startTiles: [{ coordinate: { x: getRandomNumberBetween(0, 9), y: getRandomNumberBetween(0, 9) } }],
    items: [{ coordinate: { x: getRandomNumberBetween(0, 9), y: getRandomNumberBetween(0, 9) }, category: getRandomEnumValue(ItemCategory) }],
    tiles: [{ coordinate: { x: getRandomNumberBetween(0, 9), y: getRandomNumberBetween(0, 9) }, category: getRandomEnumValue(TileCategory) }],
    doorTiles: [{ coordinate: { x: getRandomNumberBetween(0, 9), y: getRandomNumberBetween(0, 9) }, isOpened: true }],
});

const getFakeMapDto = (): CreateMapDto => ({
    name: 'test',
    description: getRandomString(),
    imagePreview: getRandomString(),
    mode: getRandomEnumValue(Mode),
    mapSize: { x: 10, y: 10 },
    startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 9, y: 9 } }],
    items: [{ coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) }],
    tiles: [
        { coordinate: { x: 1, y: 2 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 4 }, category: TileCategory.Wall },
    ],
    doorTiles: [{ coordinate: { x: 1, y: 3 }, isOpened: true }],
});

// startTiles problem
const getFakeInvalidMapDto = (): CreateMapDto => ({
    name: getRandomString(),
    description: getRandomString(),
    imagePreview: getRandomString(),
    mode: getRandomEnumValue(Mode),
    mapSize: { x: 10, y: 10 },
    startTiles: [{ coordinate: { x: 0, y: 0 } }],
    items: [{ coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) }],
    tiles: [
        { coordinate: { x: 1, y: 2 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 4 }, category: TileCategory.Wall },
    ],
    doorTiles: [{ coordinate: { x: 1, y: 3 }, isOpened: true }],
});

// door problem
const getFakeInvalidMapDto2 = (): CreateMapDto => ({
    name: getRandomString(),
    description: getRandomString(),
    imagePreview: getRandomString(),
    mode: getRandomEnumValue(Mode),
    mapSize: { x: 10, y: 10 },
    startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 9, y: 9 } }],
    items: [{ coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) }],
    tiles: [
        { coordinate: { x: 1, y: 2 }, category: TileCategory.Wall },
        { coordinate: { x: 2, y: 3 }, category: TileCategory.Ice },
        { coordinate: { x: 1, y: 4 }, category: TileCategory.Wall },
    ],
    doorTiles: [{ coordinate: { x: 1, y: 3 }, isOpened: true }],
});

// name unicity problem
const getFakeInvalidMapDto3 = (): CreateMapDto => ({
    name: 'Test de jeu',
    description: getRandomString(),
    imagePreview: getRandomString(),
    mode: getRandomEnumValue(Mode),
    mapSize: { x: 10, y: 10 },
    startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 9, y: 9 } }],
    items: [{ coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) }],
    tiles: [
        { coordinate: { x: 1, y: 2 }, category: TileCategory.Wall },
        { coordinate: { x: 2, y: 3 }, category: TileCategory.Ice },
        { coordinate: { x: 1, y: 4 }, category: TileCategory.Wall },
    ],
    doorTiles: [{ coordinate: { x: 1, y: 3 }, isOpened: true }],
});

// out of bounds
const getFakeInvalidMapDto4 = (): CreateMapDto => ({
    name: getRandomString(),
    description: getRandomString(),
    imagePreview: getRandomString(),
    mode: getRandomEnumValue(Mode),
    mapSize: { x: 10, y: 10 },
    startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 9, y: 9 } }],
    items: [{ coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) }],
    tiles: [
        { coordinate: { x: 1, y: 10 }, category: TileCategory.Wall },
        { coordinate: { x: -1, y: 9 }, category: TileCategory.Wall },
    ],
    doorTiles: [],
});

const getFakeInvalidMapDto5 = (): CreateMapDto => ({
    name: getRandomString(),
    description: getRandomString(),
    imagePreview: getRandomString(),
    mode: getRandomEnumValue(Mode),
    mapSize: { x: 10, y: 10 },
    startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 9, y: 9 } }],
    items: [{ coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) }],
    tiles: [
        { coordinate: { x: 1, y: 0 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 1 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 2 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 3 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 4 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 5 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 6 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 7 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 8 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 9 }, category: TileCategory.Wall },
    ],
    doorTiles: [],
});

// 50 below
const getFakeInvalidMapDto6 = (): CreateMapDto => ({
    name: getRandomString(),
    description: getRandomString(),
    imagePreview: getRandomString(),
    mode: getRandomEnumValue(Mode),
    mapSize: { x: 10, y: 10 },
    startTiles: [{ coordinate: { x: 8, y: 8 } }, { coordinate: { x: 9, y: 9 } }],
    items: [{ coordinate: { x: 8, y: 7 }, category: getRandomEnumValue(ItemCategory) }],
    tiles: [
        { coordinate: { x: 0, y: 0 }, category: TileCategory.Wall },
        { coordinate: { x: 0, y: 1 }, category: TileCategory.Wall },
        { coordinate: { x: 0, y: 2 }, category: TileCategory.Wall },
        { coordinate: { x: 0, y: 3 }, category: TileCategory.Wall },
        { coordinate: { x: 0, y: 4 }, category: TileCategory.Wall },
        { coordinate: { x: 0, y: 5 }, category: TileCategory.Wall },
        { coordinate: { x: 0, y: 6 }, category: TileCategory.Wall },
        { coordinate: { x: 0, y: 7 }, category: TileCategory.Wall },
        { coordinate: { x: 0, y: 8 }, category: TileCategory.Wall },
        { coordinate: { x: 0, y: 9 }, category: TileCategory.Wall },

        { coordinate: { x: 1, y: 0 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 1 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 2 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 3 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 4 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 5 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 6 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 7 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 8 }, category: TileCategory.Wall },
        { coordinate: { x: 1, y: 9 }, category: TileCategory.Wall },

        { coordinate: { x: 2, y: 0 }, category: TileCategory.Wall },
        { coordinate: { x: 2, y: 1 }, category: TileCategory.Wall },
        { coordinate: { x: 2, y: 2 }, category: TileCategory.Wall },
        { coordinate: { x: 2, y: 3 }, category: TileCategory.Wall },
        { coordinate: { x: 2, y: 4 }, category: TileCategory.Wall },
        { coordinate: { x: 2, y: 5 }, category: TileCategory.Wall },
        { coordinate: { x: 2, y: 6 }, category: TileCategory.Wall },
        { coordinate: { x: 2, y: 7 }, category: TileCategory.Wall },
        { coordinate: { x: 2, y: 8 }, category: TileCategory.Wall },
        { coordinate: { x: 2, y: 9 }, category: TileCategory.Wall },

        { coordinate: { x: 3, y: 0 }, category: TileCategory.Wall },
        { coordinate: { x: 3, y: 1 }, category: TileCategory.Wall },
        { coordinate: { x: 3, y: 2 }, category: TileCategory.Wall },
        { coordinate: { x: 3, y: 3 }, category: TileCategory.Wall },
        { coordinate: { x: 3, y: 4 }, category: TileCategory.Wall },
        { coordinate: { x: 3, y: 5 }, category: TileCategory.Wall },
        { coordinate: { x: 3, y: 6 }, category: TileCategory.Wall },
        { coordinate: { x: 3, y: 7 }, category: TileCategory.Wall },
        { coordinate: { x: 3, y: 8 }, category: TileCategory.Wall },
        { coordinate: { x: 3, y: 9 }, category: TileCategory.Wall },

        { coordinate: { x: 4, y: 0 }, category: TileCategory.Wall },
        { coordinate: { x: 4, y: 1 }, category: TileCategory.Wall },
        { coordinate: { x: 4, y: 2 }, category: TileCategory.Wall },
        { coordinate: { x: 4, y: 3 }, category: TileCategory.Wall },
        { coordinate: { x: 4, y: 4 }, category: TileCategory.Wall },
        { coordinate: { x: 4, y: 5 }, category: TileCategory.Wall },
        { coordinate: { x: 4, y: 6 }, category: TileCategory.Wall },
        { coordinate: { x: 4, y: 7 }, category: TileCategory.Wall },
        { coordinate: { x: 4, y: 8 }, category: TileCategory.Wall },
        { coordinate: { x: 4, y: 9 }, category: TileCategory.Wall },
    ],
    doorTiles: [],
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
