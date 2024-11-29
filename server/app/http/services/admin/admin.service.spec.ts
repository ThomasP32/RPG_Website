import { MapDto } from '@app/http/model/dto/map/map.dto';
import { Map, MapDocument, mapSchema } from '@app/http/model/schemas/map/map.schema';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { getConnectionToken, getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model, Types } from 'mongoose';
import { AdminService } from './admin.service';

describe('AdminServiceEndToEnd', () => {
    let service: AdminService;
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
        await mapModel.create(getFakeMap());
        expect((await service.getAllMaps()).length).toBeGreaterThan(0);
    });

    it('getMapById() return map with the specified id', async () => {
        const map = await mapModel.create(getFakeMap());
        const result = await service.getMapById(map._id.toString());
        expect(result._id.toString()).toBe(map._id.toString());
        expect(result.name).toBe(map.name);
    });

    it('getMapById() should fail if map does not exist', async () => {
        const mapId = new Types.ObjectId().toString();
        await expect(service.getMapById(mapId)).rejects.toBeTruthy();
    });

    it('deleteMap()should throw NotFoundException if map is not found', async () => {
        const fakeId = new Types.ObjectId().toHexString();
        await expect(service.deleteMap(fakeId)).rejects.toThrow(NotFoundException);
    });

    it('deleteMap() should throw BadRequestException on other errors', async () => {
        jest.spyOn(mapModel, 'deleteOne').mockRejectedValueOnce(new Error('Some database error'));
        const fakeId = new Types.ObjectId().toHexString();
        await expect(service.deleteMap(fakeId)).rejects.toThrow(BadRequestException);
    });

    it('deleteMap() should delete a map successfully', async () => {
        const map = getFakeMap();
        const mapDto = await mapModel.create(map);
        await service.deleteMap(mapDto._id.toString());
        const found = await mapModel.findById(mapDto._id);
        expect(found).toBeNull();
    });

    it('addMap() should add the map to the DB', async () => {
        const map = getFakeMap();
        await service.addMap(map);
        expect((await service.getAllMaps()).length).toBeGreaterThan(0);
    });

    it('addMap() should fail if mongo query failed', async () => {
        jest.spyOn(mapModel, 'create').mockImplementation(async () => Promise.reject(''));
        const map = getFakeMap();
        await expect(service.addMap(map)).rejects.toBeTruthy();
    });

    it('modifyMap() should update the map successfully with insertMany', async () => {
        const [map] = await mapModel.insertMany([getFakeMap()]);
        const updatedMap = getFakeUpdateMap();

        const modifiedMap = await service.modifyMap(map._id.toString(), updatedMap);

        expect(modifiedMap).toMatchObject({
            ...updatedMap,
            isVisible: false,
            lastModified: expect.any(Date),
        });

        expect(modifiedMap._id.toString()).toBe(map._id.toString());
        expect(modifiedMap.lastModified).toBeInstanceOf(Date);
    });

    it('modifyMap() should create a new map successfully if ID does not exist', async () => {
        const updatedMap = getFakeUpdateMap();
        const mapId = new Types.ObjectId().toString();

        const modifiedMap = await service.modifyMap(mapId, updatedMap);

        expect(modifiedMap).toMatchObject({
            ...updatedMap,
            isVisible: false,
            lastModified: expect.any(Date),
        });
    });

    it('modifyMap() should throw Error if map update fails for other reasons', async () => {
        jest.spyOn(mapModel, 'findById').mockRejectedValueOnce(new Error('Database error'));

        const mapId = new Types.ObjectId().toString();
        const updatedMap: MapDto = {
            name: 'Updated Map',
            description: 'Updated description',
            imagePreview: 'http://example.com/updated-image.png',
            mode: Mode.Classic,
            mapSize: { x: 10, y: 10 },
            startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 1, y: 0 } }],
            items: [
                { coordinate: { x: 1, y: 0 }, category: ItemCategory.IceSkates },
                { coordinate: { x: 2, y: 2 }, category: ItemCategory.WallBreaker },
            ],
            tiles: [],
            doorTiles: [],
        };

        await expect(service.modifyMap(mapId, updatedMap)).rejects.toThrow("Le jeu n'a pas pu être modifié");
    });

    it('visibilityToggle() should toggle the visibility of an existing map', async () => {
        const [map] = await mapModel.insertMany([getFakeMap()]);

        expect(map.isVisible).toBeDefined();
        const initialVisibility = map.isVisible;

        const modifiedMap = await service.visibilityToggle(map._id.toString());

        expect(modifiedMap.isVisible).toBe(!initialVisibility);
    });

    it('visibilityToggle() should throw NotFoundException if the map does not exist', async () => {
        const nonExistentMapId = new Types.ObjectId().toString();
        await expect(service.visibilityToggle(nonExistentMapId)).rejects.toThrow(NotFoundException);
    });

    it('should throw error when start tiles are not placed', async () => {
        await expect(service.addMap(getFakeInvalidMapDto())).rejects.toThrow(
            'Les tuiles de départ doivent toutes être placées (2 pour une petite carte, 4 pour une moyenne carte et 6 pour une grande carte)',
        );
        await expect(service.modifyMap(new Types.ObjectId().toString(), getFakeInvalidMapDto())).rejects.toThrow(
            'Les tuiles de départ doivent toutes être placées (2 pour une petite carte, 4 pour une moyenne carte et 6 pour une grande carte)',
        );
    });

    it('should throw error when doors are not free', async () => {
        await expect(service.areDoorsFree(getFakeInvalidMapDto2().doorTiles, getFakeInvalidMapDto2().tiles)).toBe(true);
        await expect(service.addMap(getFakeInvalidMapDto22())).rejects.toThrow('Toutes les portes doivent être libérées');
        await expect(service.addMap(getFakeInvalidMapDto23())).rejects.toThrow('Toutes les portes doivent être libérées');
        await expect(service.modifyMap(new Types.ObjectId().toString(), getFakeInvalidMapDto22())).rejects.toThrow(
            'Toutes les portes doivent être libérées',
        );
    });

    it('should throw error when elements are out of bounds', async () => {
        await expect(service.addMap(getFakeInvalidMapDto4())).rejects.toThrow("Tous les éléments doivent être à l'intérieur de la carte");
        await expect(service.modifyMap(new Types.ObjectId().toString(), getFakeInvalidMapDto4())).rejects.toThrow(
            "Tous les éléments doivent être à l'intérieur de la carte",
        );
    });

    it('should throw error when there are isolated ground tiles', async () => {
        await expect(service.addMap(getFakeInvalidMapDto5())).rejects.toThrow('Le jeu ne doit pas avoir de tuile de terrain isolée');
        await expect(service.modifyMap(new Types.ObjectId().toString(), getFakeInvalidMapDto5())).rejects.toThrow(
            'Le jeu ne doit pas avoir de tuile de terrain isolée',
        );
    });

    it('should throw error when less than 50% are grass tiles', async () => {
        await expect(service.addMap(getFakeInvalidMapDto6())).rejects.toThrow('La surface de jeu doit contenir plus de 50% de tuiles de terrain');
        await expect(service.modifyMap(new Types.ObjectId().toString(), getFakeInvalidMapDto6())).rejects.toThrow(
            'La surface de jeu doit contenir plus de 50% de tuiles de terrain',
        );
    });

    it('should throw error when not enough items', async () => {
        await expect(service.addMap(getFakeInvalidMapDto7())).rejects.toThrow(
            'Des items sont manquants (au moins 2 pour une petite carte, 4 pour une moyenne carte et 6 pour une grande carte',
        );
        await expect(service.modifyMap(new Types.ObjectId().toString(), getFakeInvalidMapDto7())).rejects.toThrow(
            'Des items sont manquants (au moins 2 pour une petite carte, 4 pour une moyenne carte et 6 pour une grande carte',
        );
    });

    it('should throw error when flag is not placed in ctf mode', async () => {
        await expect(service.addMap(getFakeInvalidMapDto8())).rejects.toThrow('Le drapeau doit être placé pour un jeu en mode CTF.');
        await expect(service.modifyMap(new Types.ObjectId().toString(), getFakeInvalidMapDto8())).rejects.toThrow(
            'Le drapeau doit être placé pour un jeu en mode CTF.',
        );
    });

    it('should throw exceptions when adding map with name that already exists', async () => {
        const mapDto: MapDto = {
            name: 'testMap',
            description: 'test description',
            imagePreview: 'test-image-url',
            mode: Mode.Classic,
            mapSize: { x: 10, y: 10 },
            startTiles: [{ coordinate: { x: 12, y: 0 } }, { coordinate: { x: 1, y: 0 } }],
            items: [],
            tiles: [],
            doorTiles: [],
        };
        await mapModel.insertMany([mapDto]);
        await expect(service.verifyMap(mapDto)).rejects.toThrow(ConflictException);
        await expect(service.verifyMapModification(new Types.ObjectId().toString(), mapDto)).rejects.toThrow(ConflictException);
    });

    const getFakeMap = (): MapDto => ({
        name: 'Bonjour',
        description: getRandomString(),
        imagePreview: getRandomString(),
        mode: Mode.Classic,
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 9, y: 9 } }],
        items: [
            { coordinate: { x: 1, y: 0 }, category: ItemCategory.IceSkates },
            { coordinate: { x: 2, y: 2 }, category: ItemCategory.WallBreaker },
        ],
        tiles: [
            { coordinate: { x: 1, y: 2 }, category: TileCategory.Wall },
            { coordinate: { x: 1, y: 4 }, category: TileCategory.Wall },
        ],
        doorTiles: [{ coordinate: { x: 1, y: 3 }, isOpened: true }],
    });

    const getFakeUpdateMap = (): MapDto => ({
        name: 'Hello',
        description: getRandomString(),
        imagePreview: getRandomString(),
        mode: Mode.Classic,
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 9, y: 9 } }],
        items: [
            { coordinate: { x: 1, y: 0 }, category: ItemCategory.IceSkates },
            { coordinate: { x: 2, y: 2 }, category: ItemCategory.WallBreaker },
        ],
        tiles: [
            { coordinate: { x: 1, y: 2 }, category: TileCategory.Wall },
            { coordinate: { x: 1, y: 4 }, category: TileCategory.Wall },
        ],
        doorTiles: [{ coordinate: { x: 1, y: 3 }, isOpened: true }],
    });

    // startTiles problem
    const getFakeInvalidMapDto = (): MapDto => ({
        name: getRandomString(),
        description: getRandomString(),
        imagePreview: getRandomString(),
        mode: Mode.Classic,
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: 0, y: 0 } }],
        items: [
            { coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) },
            { coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) },
        ],
        tiles: [
            { coordinate: { x: 1, y: 2 }, category: TileCategory.Wall },
            { coordinate: { x: 1, y: 4 }, category: TileCategory.Wall },
        ],
        doorTiles: [{ coordinate: { x: 1, y: 3 }, isOpened: true }],
    });

    // door problem
    const getFakeInvalidMapDto2 = (): MapDto => ({
        name: getRandomString(),
        description: getRandomString(),
        imagePreview: getRandomString(),
        mode: Mode.Classic,
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 9, y: 9 } }],
        items: [
            { coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) },
            { coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) },
        ],
        tiles: [
            { coordinate: { x: 1, y: 2 }, category: TileCategory.Wall },
            { coordinate: { x: 1, y: 4 }, category: TileCategory.Wall },
            { coordinate: { x: 5, y: 1 }, category: TileCategory.Wall },
            { coordinate: { x: 3, y: 1 }, category: TileCategory.Wall },
        ],
        doorTiles: [
            { coordinate: { x: 1, y: 3 }, isOpened: true },
            { coordinate: { x: 4, y: 1 }, isOpened: true },
        ],
    });

    // door problem 2
    const getFakeInvalidMapDto22 = (): MapDto => ({
        name: getRandomString(),
        description: getRandomString(),
        imagePreview: getRandomString(),
        mode: Mode.Classic,
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 9, y: 9 } }],
        items: [
            { coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) },
            { coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) },
        ],
        tiles: [
            { coordinate: { x: 5, y: 1 }, category: TileCategory.Wall },
            { coordinate: { x: 3, y: 1 }, category: TileCategory.Wall },
            { coordinate: { x: 4, y: 1 }, category: TileCategory.Wall },
            { coordinate: { x: 4, y: 0 }, category: TileCategory.Wall },
        ],
        doorTiles: [
            { coordinate: { x: 4, y: 1 }, isOpened: true },
            { coordinate: { x: 4, y: 2 }, isOpened: false },
        ],
    });

    const getFakeInvalidMapDto23 = (): MapDto => ({
        name: getRandomString(),
        description: getRandomString(),
        imagePreview: getRandomString(),
        mode: Mode.Classic,
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 9, y: 9 } }],
        items: [
            { coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) },
            { coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) },
        ],
        tiles: [
            { coordinate: { x: 3, y: 2 }, category: TileCategory.Wall },
            { coordinate: { x: 3, y: 0 }, category: TileCategory.Wall },
            { coordinate: { x: 4, y: 2 }, category: TileCategory.Wall },
            { coordinate: { x: 4, y: 0 }, category: TileCategory.Wall },
        ],
        doorTiles: [
            { coordinate: { x: 4, y: 1 }, isOpened: true },
            { coordinate: { x: 3, y: 1 }, isOpened: false },
        ],
    });

    // out of bounds
    const getFakeInvalidMapDto4 = (): MapDto => ({
        name: getRandomString(),
        description: getRandomString(),
        imagePreview: getRandomString(),
        mode: Mode.Classic,
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 9, y: 9 } }],
        items: [
            { coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) },
            { coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) },
        ],
        tiles: [
            { coordinate: { x: 1, y: 10 }, category: TileCategory.Wall },
            { coordinate: { x: -1, y: 9 }, category: TileCategory.Wall },
        ],
        doorTiles: [],
    });

    // isolated ground tiles
    const getFakeInvalidMapDto5 = (): MapDto => ({
        name: getRandomString(),
        description: getRandomString(),
        imagePreview: getRandomString(),
        mode: Mode.Classic,
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 9, y: 9 } }],
        items: [
            { coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) },
            { coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) },
        ],
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
    const getFakeInvalidMapDto6 = (): MapDto => ({
        name: getRandomString(),
        description: getRandomString(),
        imagePreview: getRandomString(),
        mode: Mode.Ctf,
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: 8, y: 8 } }, { coordinate: { x: 9, y: 9 } }],
        items: [
            { coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) },
            { coordinate: { x: 1, y: 0 }, category: getRandomEnumValue(ItemCategory) },
            { coordinate: { x: 1, y: 0 }, category: ItemCategory.Flag },
        ],
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

    const getFakeInvalidMapDto7 = (): MapDto => ({
        name: getRandomString(),
        description: getRandomString(),
        imagePreview: getRandomString(),
        mode: Mode.Classic,
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 0, y: 0 } }],
        items: [{ coordinate: { x: 1, y: 0 }, category: ItemCategory.IceSkates }],
        tiles: [
            { coordinate: { x: 1, y: 2 }, category: TileCategory.Wall },
            { coordinate: { x: 1, y: 4 }, category: TileCategory.Wall },
        ],
        doorTiles: [{ coordinate: { x: 1, y: 3 }, isOpened: true }],
    });

    const getFakeInvalidMapDto8 = (): MapDto => ({
        name: getRandomString(),
        description: getRandomString(),
        imagePreview: getRandomString(),
        mode: Mode.Ctf,
        mapSize: { x: 10, y: 10 },
        startTiles: [{ coordinate: { x: 0, y: 0 } }, { coordinate: { x: 0, y: 0 } }],
        items: [
            { coordinate: { x: 1, y: 0 }, category: ItemCategory.IceSkates },
            { coordinate: { x: 2, y: 2 }, category: ItemCategory.Sword },
        ],
        tiles: [
            { coordinate: { x: 1, y: 2 }, category: TileCategory.Wall },
            { coordinate: { x: 1, y: 4 }, category: TileCategory.Wall },
        ],
        doorTiles: [{ coordinate: { x: 1, y: 3 }, isOpened: true }],
    });

    const BASE_36 = 36;
    const getRandomString = (): string => (Math.random() + 1).toString(BASE_36).substring(2);

    function getRandomEnumValue<T>(enumObj: T): T[keyof T] {
        const enumValues = Object.values(enumObj) as T[keyof T][];
        const randomIndex = Math.floor(Math.random() * enumValues.length);
        return enumValues[randomIndex];
    }
});
