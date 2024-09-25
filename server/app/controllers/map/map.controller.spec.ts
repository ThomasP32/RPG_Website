import { MapController } from '@app/controllers/map/map.controller';
import { CreateMapDto } from '@app/model/dto/map/create-map.dto';
import { MapService } from '@app/services/map/map.service';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';

describe('MapController', () => {
    let mapController: MapController;
    let mapService: MapService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MapController],
            providers: [
                {
                    provide: MapService,
                    useValue: {
                        getAllMaps: jest.fn(),
                        getMapByName: jest.fn(),
                        addMap: jest.fn(),
                        deleteMap: jest.fn(),
                    },
                },
            ],
        }).compile();

        mapController = module.get<MapController>(MapController);
        mapService = module.get<MapService>(MapService);
    });

        it('should return 201 if the map is created successfully', async () => {
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            } as unknown as Response;

            const mapDto: CreateMapDto = {
                startTiles: [{ coordinate: { x: 1, y: 1 } }],
                mapSize: { x: 10, y: 10 },
                tiles: [], // Ajoute d'autres propriétés nécessaires
            };

            mapService.addMap = jest.fn().mockResolvedValue(undefined); // Simule un succès

            await mapController.addMap(mapDto, response);

            expect(response.status).toHaveBeenCalledWith(HttpStatus.CREATED);
            expect(response.send).toHaveBeenCalled();
        });

        it('should return 400 on generic error', async () => {
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            } as unknown as Response;

            const mapDto: CreateMapDto = {
                startTiles: [{ coordinate: { x: 1, y: 1 } }],
                mapSize: { x: 10, y: 10 },
                tiles: [],
            };

            const errorMessage = 'Some error occurred';
            mapService.addMap = jest.fn().mockRejectedValue(new Error(errorMessage)); // Simule une erreur

            await mapController.addMap(mapDto, response);

            expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
            expect(response.send).toHaveBeenCalledWith(errorMessage);
        });
    });

    // Tu peux ajouter d'autres tests pour les autres méthodes ici.
});