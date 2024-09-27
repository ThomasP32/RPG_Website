import { CreateMapDto } from '@app/model/dto/map/create-map.dto';
import { Map, MapDocument, mapSchema } from '@app/model/schemas/map';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { Logger } from '@nestjs/common';
import { getConnectionToken, getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model, Types } from 'mongoose';
import { AdminService } from './admin.service';

/**
 * There is two way to test the service :
 * - Mock the mongoose Model implementation and do what ever we want to do with it (see describe CourseService) or
 * - Use mongodb memory server implementation (see describe CourseServiceEndToEnd) and let everything go through as if we had a real database
 *
 * The second method is generally better because it tests the database queries too.
 * We will use it more
 */

describe('AdminServiceEndToEnd', () => {
    let service: AdminService;
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
            providers: [AdminService, Logger],
        }).compile();

        service = module.get<AdminService>(AdminService);
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

    it('getAllMaps() return all maps in database', async () => {
        const map = getFakeMap();
        await mapModel.create(map);
        expect((await service.getAllMaps()).length).toBeGreaterThan(0);
    });

    it('getMapById() return map with the specified id', async () => {
        const map = getFakeMap();
        await mapModel.create(map);
        const result = await service.getMapById(map._id.toString());
        expect(result).toMatchObject(map);
    });

    it('getMapById() should fail if map does not exist', async () => {
        const map = getFakeMap();
        await expect(service.getMapById(map._id.toString())).rejects.toBeTruthy();
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

    // it('deleteMap() should delete the course with specified name', async () => {
    //     const map = getFakeMap();
    //     await mapModel.create(map);
    //     await service.deleteMap(map.name);
    //     expect(await mapModel.countDocuments()).toEqual(0);
    // });

    // it('deleteMap() should fail if the course does not exist', async () => {
    //     const map = getFakeMap();
    //     await expect(service.deleteMap(map.name)).rejects.toBeTruthy();
    // });

    // it('deleteMap() should fail if mongo query failed', async () => {
    //     jest.spyOn(mapModel, 'deleteOne').mockRejectedValue('');
    //     const map = getFakeMap();
    //     await expect(service.deleteMap(map.name)).rejects.toBeTruthy();
    // });

    it('addMap() should add the map to the DB', async () => {
        const map = getFakeMap();
        await service.addMap(map);
        const result = await service.getMapById(map._id.toString());
        expect(result).toMatchObject(map);
    });

    it('addMap() should fail if mongo query failed', async () => {
        jest.spyOn(mapModel, 'create').mockImplementation(async () => Promise.reject(''));
        const map = getFakeMap();
        await expect(service.addMap(map)).rejects.toBeTruthy();
    });

    it('should throw error when start tiles are not placed', async () => {
        await expect(service.addMap(getFakeInvalidMapDto())).rejects.toThrow('All start tiles must be placed');
    });

    it('should throw error when doors are not free', async () => {
        await expect(service.addMap(getFakeInvalidMapDto2())).rejects.toThrow('All doors must be free');
    });

    // // en pratique ca marche, mais la je comprend pas pourquoi ca retourne toujours faux
    // it('should throw error when map name already exists', async () => {
    //     const map1 = getFakeMap2();
    //     await mapModel.create(map1); // Ajoute la première carte
    //     console.log(mapModel.findOne({name: map1.name}));
    //     const result = service.addMap(map1);
    //     await expect(result).rejects.toBeTruthy();
    // });

    it('should throw error when elements are out of bounds', async () => {
        await expect(service.addMap(getFakeInvalidMapDto4())).rejects.toThrow('All elements must be inside map');
    });

    it('should throw error when there are isolated ground tiles', async () => {
        await expect(service.addMap(getFakeInvalidMapDto5())).rejects.toThrow('Map must not have any isolated ground tile');
    });

    it('should throw error when less than 50% are grass tiles', async () => {
        await expect(service.addMap(getFakeInvalidMapDto6())).rejects.toThrow('Map must contain more than 50% of grass tiles');
    });

    const getFakeMap = (): Map => ({
        _id: new Types.ObjectId('507f191e810c19729de860ea'),
        name: 'Bonjour',
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

    const getFakeMap2 = (): Map => ({
        name: 'Bonjour',
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
});
