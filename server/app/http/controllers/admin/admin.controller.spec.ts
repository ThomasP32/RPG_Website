import { MapDocument } from '@app/http/model/schemas/map/map.schema';
import { AdminService } from '@app/http/services/admin/admin.service';
import { DetailedMap, Mode } from '@common/map.types';
import { ConflictException, ForbiddenException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { Types } from 'mongoose';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { AdminController } from './admin.controller';

describe('AdminController', () => {
    let controller: AdminController;
    let adminService: SinonStubbedInstance<AdminService>;

    beforeEach(async () => {
        adminService = createStubInstance(AdminService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminController],
            providers: [
                {
                    provide: AdminService,
                    useValue: adminService,
                },
            ],
        }).compile();

        controller = module.get<AdminController>(AdminController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('allMaps() should return all maps', async () => {
        const fakeMaps: DetailedMap[] = [
            {
                _id: new Types.ObjectId(),
                name: 'Map1',
                description: 'Description1',
                imagePreview: 'http://example.com/map1.png',
                mode: Mode.Classic,
                mapSize: { x: 10, y: 10 },
                startTiles: [],
                items: [],
                tiles: [],
                doorTiles: [],
                isVisible: true,
                lastModified: new Date(),
            },
        ];
        adminService.getAllMaps.resolves(fakeMaps);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (maps) => {
            expect(maps).toEqual(fakeMaps);
            return res;
        };

        await controller.allMaps(res);
    });

    it('allMaps() should return NOT_FOUND when service fails to fetch maps', async () => {
        adminService.getAllMaps.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.allMaps(res);
    });

    it('addMap() should succeed if service can add the map', async () => {
        const createMapDto = {
            name: 'New Map',
            description: 'Test map',
            imagePreview: 'http://example.com/test.png',
            mode: Mode.Ctf,
            mapSize: { x: 20, y: 20 },
            startTiles: [],
            items: [],
            tiles: [],
            doorTiles: [],
        };

        adminService.addMap.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.CREATED);
            return res;
        };
        res.send = () => res;

        await controller.addMap(createMapDto, res);
    });

    it('addMap() should return BAD_REQUEST with message if adding the map fails', async () => {
        const mapDto = {
            name: 'New Map',
            description: 'Test map',
            imagePreview: 'http://example.com/test.png',
            mode: Mode.Ctf,
            mapSize: { x: 20, y: 20 },
            startTiles: [],
            items: [],
            tiles: [],
            doorTiles: [],
        };

        adminService.addMap.rejects(new Error());

        const res = {} as unknown as Response;
        res.status = (code: number) => {
            expect(code).toEqual(HttpStatus.BAD_REQUEST);
            return res;
        };
        res.json = (payload) => {
            expect(payload).toEqual({
                status: HttpStatus.BAD_REQUEST,
                message: 'La création du jeu a échoué',
            });
            return res;
        };

        await controller.addMap(mapDto, res);
    });

    it('modifyMap() should return BAD_REQUEST with message if updating the map fails', async () => {
        const mapDto = {
            name: 'New Map',
            description: 'Test map',
            imagePreview: 'http://example.com/test.png',
            mode: Mode.Ctf,
            mapSize: { x: 20, y: 20 },
            startTiles: [],
            items: [],
            tiles: [],
            doorTiles: [],
        };

        adminService.modifyMap.rejects(new Error());

        const res = {} as unknown as Response;
        res.status = (code: number) => {
            expect(code).toEqual(HttpStatus.BAD_REQUEST);
            return res;
        };
        res.json = (payload) => {
            expect(payload).toEqual({
                status: HttpStatus.BAD_REQUEST,
                message: 'La modification du jeu a échoué',
            });
            return res;
        };

        await controller.modifyMap(new Types.ObjectId().toString(), mapDto, res);
    });

    it('getMapById() should return the map with the specified ID', async () => {
        const mapId = new Types.ObjectId();
        const fakeMap: DetailedMap = {
            _id: mapId,
            name: 'Test Map',
            description: 'This is a test map',
            imagePreview: 'http://example.com/test.png',
            mode: Mode.Classic,
            mapSize: { x: 20, y: 20 },
            startTiles: [{ coordinate: { x: 0, y: 0 } }],
            items: [],
            tiles: [],
            doorTiles: [],
            isVisible: true,
            lastModified: new Date(),
        };
        adminService.getMapById.resolves({ ...fakeMap, lastModified: new Date(), _id: mapId });

        const res = {} as unknown as Response;
        res.status = (code: number) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (map) => {
            expect(map).toEqual(
                expect.objectContaining({
                    ...fakeMap,
                    lastModified: expect.any(Date),
                    _id: mapId,
                }),
            );
            return res;
        };

        await controller.getMapById(mapId.toString(), res);
    });

    it('modifyMap() should return OK if map is successfully modified', async () => {
        const originalMap: DetailedMap = {
            _id: new Types.ObjectId(),
            name: 'Original Map',
            description: 'Original description',
            imagePreview: 'http://example.com/original.png',
            mode: Mode.Classic,
            mapSize: { x: 20, y: 20 },
            startTiles: [{ coordinate: { x: 0, y: 0 } }],
            items: [],
            tiles: [],
            doorTiles: [],
            isVisible: true,
            lastModified: new Date(),
        };

        const updateDto = {
            name: 'Modified Map',
            description: 'Modified description',
            imagePreview: 'http://example.com/modified.png',
            mode: Mode.Ctf,
            mapSize: { x: 30, y: 30 },
            startTiles: [{ coordinate: { x: 0, y: 1 } }],
            items: [],
            tiles: [],
            doorTiles: [],
        };

        adminService.modifyMap.resolves({ ...originalMap, ...updateDto, lastModified: new Date() });

        const res = {} as unknown as Response;
        res.status = (code: number) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (map) => {
            expect(map.name).toEqual('Modified Map');
            expect(map.description).toEqual('Modified description');
            return res;
        };

        await controller.modifyMap(originalMap._id.toString(), updateDto, res);
    });

    it('modifyMap() should return CONFLICT if a map with the same name exists', async () => {
        adminService.modifyMap.rejects(new ConflictException('Un jeu avec ce nom existe déjà'));

        const res = {} as unknown as Response;
        res.status = (code: number) => {
            expect(code).toEqual(HttpStatus.CONFLICT);
            return res;
        };
        res.json = (payload) => {
            expect(payload).toEqual({
                status: HttpStatus.CONFLICT,
                message: 'Un jeu avec ce nom existe déjà',
            });
            return res;
        };

        await controller.modifyMap('someMapId', { name: 'Duplicate Map' } as any, res);
    });

    it('modifyMap() should return FORBIDDEN if the map violates constraints', async () => {
        adminService.modifyMap.rejects(new ForbiddenException('Violation des contraintes'));
        const res = {} as unknown as Response;
        res.status = (code: number) => {
            expect(code).toEqual(HttpStatus.FORBIDDEN);
            return res;
        };
        res.json = (payload) => {
            expect(payload).toEqual({
                status: HttpStatus.FORBIDDEN,
                message: 'Violation des contraintes',
            });
            return res;
        };
        await controller.modifyMap('someMapId', { name: 'Map with Issues' } as any, res);
    });

    it('modifyMap() should return BAD_REQUEST if updating the map fails', async () => {
        adminService.modifyMap.rejects(new Error('Failed to update map'));
        const res = {} as unknown as Response;
        res.status = (code: number) => {
            expect(code).toEqual(HttpStatus.BAD_REQUEST);
            return res;
        };
        res.json = (payload) => {
            expect(payload).toEqual({
                status: HttpStatus.BAD_REQUEST,
                message: 'Failed to update map',
            });
            return res;
        };
        await controller.modifyMap('someMapId', { name: 'Invalid Map' } as any, res);
    });

    it('getMapById() should return the map with the specified ID', async () => {
        const mapId = new Types.ObjectId();
        const fakeMap = {
            _id: mapId,
            name: 'Test Map',
            description: 'This is a test map',
            imagePreview: 'http://example.com/test.png',
            mode: Mode.Classic,
            mapSize: { x: 20, y: 20 },
            startTiles: [{ coordinate: { x: 0, y: 0 } }],
            items: [],
            tiles: [],
            doorTiles: [],
            isVisible: true,
        };
        adminService.getMapById.resolves({ ...fakeMap, lastModified: new Date(), _id: mapId });
        const res = {} as unknown as Response;
        res.status = (code: number) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (map) => {
            expect(map).toEqual(
                expect.objectContaining({
                    ...fakeMap,
                    lastModified: expect.any(Date),
                    _id: mapId,
                }),
            );
            return res;
        };
        await controller.getMapById(mapId.toString(), res);
    });

    it('getMapById() should return NOT_FOUND if the map does not exist', async () => {
        const mapId = new Types.ObjectId().toString();
        adminService.getMapById.rejects(new Error('Map not found'));
        const res = {} as unknown as Response;
        res.status = (code: number) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = (message) => {
            expect(message).toEqual('Map not found');
            return res;
        };
        await controller.getMapById(mapId, res);
    });

    it('visibilityToggle() should toggle visibility of a map and return OK', async () => {
        const mapId = new Types.ObjectId().toString();
        const fakeReturningMap: DetailedMap = {
            _id: new Types.ObjectId(mapId),
            name: 'Test Map',
            description: 'This is a test map',
            imagePreview: 'http://example.com/test.png',
            mode: Mode.Classic,
            mapSize: { x: 20, y: 20 },
            startTiles: [{ coordinate: { x: 0, y: 0 } }],
            items: [],
            tiles: [],
            doorTiles: [],
            isVisible: true,
            lastModified: new Date(),
        };
        const toggledMap: DetailedMap = {
            ...fakeReturningMap,
            isVisible: !fakeReturningMap.isVisible,
        };

        adminService.visibilityToggle.resolves(toggledMap as MapDocument);
        let responseData;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockImplementation((data) => {
                responseData = data;
            }),
        } as unknown as Response;
        await controller.visibilityToggle(mapId, res);
        expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(responseData).toEqual(toggledMap);
    });

    it('visibilityToggle() should return NOT_FOUND if the map ID does not exist', async () => {
        const nonExistentMapId = new Types.ObjectId().toString();
        adminService.visibilityToggle.rejects(new Error('Map not found'));
        const res = {} as unknown as Response;
        res.status = (code: number) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = (error) => {
            expect(error.message).toEqual('Map not found');
            return res;
        };
        await controller.visibilityToggle(nonExistentMapId, res);
    });

    it('should return OK if deleteMap is successful', async () => {
        const mapId = new Types.ObjectId().toString();
        adminService.deleteMap.resolves();
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        } as unknown as Response;
        await controller.deleteCourse(mapId, res);
        expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(res.send).toHaveBeenCalled();
    });

    it('should return NOT_FOUND if deleteMap throws an error with status NOT_FOUND', async () => {
        const mapId = new Types.ObjectId().toString();

        const error = new Error('Map not found');
        (error as any).status = HttpStatus.NOT_FOUND;
        adminService.deleteMap.rejects(error);

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        await controller.deleteCourse(mapId, res);

        expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
        expect(res.json).toHaveBeenCalledWith({
            status: HttpStatus.NOT_FOUND,
            message: 'Map not found',
        });
    });

    it('should return BAD_REQUEST if deleteMap throws a generic error', async () => {
        const mapId = new Types.ObjectId().toString();
        const error = new Error('Failed to delete map');
        (error as any).status = undefined;
        adminService.deleteMap.rejects(error);
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;
        await controller.deleteCourse(mapId, res);
        expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(res.json).toHaveBeenCalledWith({
            status: HttpStatus.BAD_REQUEST,
            message: 'Failed to delete map',
        });
    });
});
