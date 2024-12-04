import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { MapService } from '@app/services/map/map.service';
import { Cell } from '@common/map-cell';
import { ItemCategory, Map, Mode, TileCategory } from '@common/map.types';
import { of, throwError } from 'rxjs';

describe('MapService', () => {
    let service: MapService;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationMapService>;
    let mockMap: Map;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        mockMap = {
            name: 'Test Map',
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
            description: '',
            imagePreview: '',
            mode: Mode.Classic,
        };

        communicationServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['basicPut', 'basicPost', 'basicGet']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        TestBed.configureTestingModule({
            providers: [
                MapService,
                { provide: CommunicationMapService, useValue: communicationServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        });
        service = TestBed.inject(MapService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should create a new map with the specified mode and size', () => {
        const mode = Mode.Classic;
        const size = 10;

        service.createMap(mode, size);

        expect(service.map).toEqual({
            name: '',
            description: '',
            imagePreview: '',
            mode: mode,
            mapSize: { x: size, y: size },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
        });
    });

    it('should redirect to / when an error occurs during getMap', async () => {
        const errorResponse = new HttpErrorResponse({
            status: 404,
            error: 'Map not found',
        });
        communicationServiceSpy.basicGet.and.returnValue(throwError(() => errorResponse));

        await service.getMap('invalid-id');

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should trigger generate map', () => {
        spyOn(service.generateMapSource, 'next');
        service.generateMap();
        expect(service.generateMapSource.next).toHaveBeenCalled();
    });

    it('should trigger reset map', () => {
        spyOn(service.resetMapSource, 'next');
        service.resetMap();
        expect(service.resetMapSource.next).toHaveBeenCalled();
    });

    it('should update selected tile', () => {
        let selectedTile = '';
        service.updateSelectedTileSource.subscribe((tile: string) => (selectedTile = tile));

        service.updateSelectedTile(TileCategory.Wall);
        expect(selectedTile).toBe(TileCategory.Wall);

        service.updateSelectedTile('door');
        expect(selectedTile).toBe('door');
    });

    it('should retrieve a map and set the map property', async () => {
        const mockMap2: Map = {
            name: 'Test Map',
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
            description: '',
            imagePreview: '',
            mode: Mode.Classic,
        };

        communicationServiceSpy.basicGet.and.returnValue(of({ ...mockMap2, _id: '2', isVisible: false, lastModified: new Date() }));
        await service.getMap('2');
        expect(service.map).toEqual(mockMap2);
        expect(communicationServiceSpy.basicGet).toHaveBeenCalledOnceWith('admin/2');
    });

    describe('SaveNewMap', () => {
        it('should save new map', async () => {
            communicationServiceSpy.basicPost.and.returnValue(of(new HttpResponse({ body: 'response' })));
            service.map = mockMap;
            const result = await service.saveNewMap();

            expect(communicationServiceSpy.basicPost).toHaveBeenCalledOnceWith('admin/creation', mockMap);
            expect(result).toBe('Votre jeu a été sauvegardé avec succès!');
        });

        it('should handle HttpErrorResponse with JSON error body for saveNewMap', async () => {
            const errorResponse = new HttpErrorResponse({
                status: 400,
                error: JSON.stringify({ message: 'Test error message' }),
            });

            communicationServiceSpy.basicPost.and.returnValue(throwError(() => errorResponse));
            const result = await service.saveNewMap();
            expect(result).toBe('Test error message');
        });

        it('should handle HttpErrorResponse with non-JSON error body for saveNewMap', async () => {
            const errorResponse = new HttpErrorResponse({
                status: 400,
                error: 'Non-JSON error message',
            });

            communicationServiceSpy.basicPost.and.returnValue(throwError(() => errorResponse));
            const result = await service.saveNewMap();
            expect(result).toBe('Erreur inattendue, veuillez réessayer plus tard...');
        });

        it('should handle unknown error type for saveNewMap', async () => {
            const unknownError = new Error('Unknown error');

            communicationServiceSpy.basicPost.and.returnValue(throwError(() => unknownError));
            const result = await service.saveNewMap();
            expect(result).toBe('Erreur inconnue, veuillez réessayer plus tard...');
        });

        it('should handle HttpErrorResponse with array of messages for saveNewMap', async () => {
            const errorResponse = new HttpErrorResponse({
                status: 400,
                error: JSON.stringify({ message: ['Error part 1', 'and error part 2'] }),
            });

            communicationServiceSpy.basicPost.and.returnValue(throwError(() => errorResponse));
            const result = await service.saveNewMap();

            expect(result).toBe('Error part 1 and error part 2');
        });
    });

    describe('UpdateMap', () => {
        it('should update existing map', () => {
            const id = '1';
            const map = {
                name: 'Test Map updated',
                mapSize: { x: 10, y: 10 },
                startTiles: [],
                items: [],
                doorTiles: [],
                tiles: [],
                description: '',
                imagePreview: '',
                mode: Mode.Classic,
            };

            communicationServiceSpy.basicPut.and.returnValue(of(new HttpResponse({ body: 'response' })));
            service.map = map;
            service.updateMap(id);

            expect(communicationServiceSpy.basicPut).toHaveBeenCalledOnceWith(`admin/edition/${id}`, map);
        });

        it('should handle HttpErrorResponse with non-JSON error body for updateNewMap', async () => {
            const errorResponse = new HttpErrorResponse({
                status: 400,
                error: 'Non-JSON error message',
            });

            communicationServiceSpy.basicPut.and.returnValue(throwError(() => errorResponse));
            const result = await service.updateMap('1');
            expect(result).toBe('Erreur inattendue, veuillez réessayer plus tard...');
        });

        it('should handle unknown error type for updateMap', async () => {
            const unknownError = new Error('Unknown error');

            communicationServiceSpy.basicPut.and.returnValue(throwError(() => unknownError));
            const result = await service.updateMap('1');
            expect(result).toBe('Erreur inconnue, veuillez réessayer plus tard...');
        });

        it('should handle HttpErrorResponse with array of messages for updateMap', async () => {
            const errorResponse = new HttpErrorResponse({
                status: 400,
                error: JSON.stringify({ message: ['Error part 1', 'and error part 2'] }),
            });

            communicationServiceSpy.basicPut.and.returnValue(throwError(() => errorResponse));
            const result = await service.updateMap('1');

            expect(result).toBe('Error part 1 and error part 2');
        });

        it('should handle HttpErrorResponse with string message for updateMap', async () => {
            const errorResponse = new HttpErrorResponse({
                status: 400,
                error: JSON.stringify({ message: 'JSON string message' }),
            });

            communicationServiceSpy.basicPut.and.returnValue(throwError(() => errorResponse));
            const result = await service.updateMap('1');

            expect(result).toBe('JSON string message');
        });
    });
    describe('MapService - generateMapFromEdition', () => {
        let service: MapService;

        beforeEach(() => {
            const mockCommunicationService = jasmine.createSpyObj('CommunicationMapService', ['basicPut', 'basicPost', 'basicGet']);
            const mockRouter = jasmine.createSpyObj('Router', ['navigate']);
            service = new MapService(mockCommunicationService, mockRouter);
            service.createMap(Mode.Classic, 10);
        });

        it('should generate map from edition with correct door tiles', () => {
            const map: Cell[][] = [
                [
                    {
                        tileType: TileCategory.Wall,
                        door: { isDoor: true, isOpen: true },
                        isStartingPoint: false,
                        coordinate: { x: 0, y: 0 },
                        isOccupied: false,
                        isHovered: false,
                        alternateCoordinates: { x: 0, y: 0 },
                    },
                ],
                [
                    {
                        tileType: TileCategory.Water,
                        door: { isDoor: false, isOpen: false },
                        isStartingPoint: false,
                        coordinate: { x: 1, y: 0 },
                        isOccupied: false,
                        isHovered: false,
                        alternateCoordinates: { x: 1, y: 0 },
                    },
                ],
            ];

            service.generateMapFromEdition(map);

            expect(service.map.doorTiles.length).toBe(1);
            expect(service.map.doorTiles[0]).toEqual({ coordinate: { x: 0, y: 0 }, isOpened: true });
        });

        it('should generate map from edition with correct tiles', () => {
            const map: Cell[][] = [
                [
                    {
                        tileType: TileCategory.Wall,
                        door: { isDoor: false, isOpen: false },
                        isStartingPoint: false,
                        coordinate: { x: 0, y: 0 },
                        isOccupied: false,
                        isHovered: false,
                        alternateCoordinates: { x: 0, y: 0 },
                    },
                ],
                [
                    {
                        tileType: TileCategory.Water,
                        door: { isDoor: false, isOpen: false },
                        isStartingPoint: false,
                        coordinate: { x: 0, y: 0 },
                        isOccupied: false,
                        isHovered: false,
                        alternateCoordinates: { x: 0, y: 0 },
                    },
                ],
            ];

            service.generateMapFromEdition(map);

            expect(service.map.tiles.length).toBe(2);
            expect(service.map.tiles[0]).toEqual({ coordinate: { x: 0, y: 0 }, category: TileCategory.Wall });
            expect(service.map.tiles[1]).toEqual({ coordinate: { x: 1, y: 0 }, category: TileCategory.Water });
        });

        it('should generate map from edition with correct items', () => {
            const map: Cell[][] = [
                [
                    {
                        tileType: TileCategory.Wall,
                        door: { isDoor: false, isOpen: false },
                        isStartingPoint: true,
                        item: ItemCategory.Sword,
                        coordinate: { x: 0, y: 0 },
                        isOccupied: false,
                        isHovered: false,
                        alternateCoordinates: { x: 0, y: 0 },
                    },
                ],
            ];

            service.generateMapFromEdition(map);

            expect(service.map.items.length).toBe(1);
            expect(service.map.items[0]).toEqual({ coordinate: { x: 0, y: 0 }, category: ItemCategory.Sword });
        });

        it('should generate map from edition with correct start tiles', () => {
            const map: Cell[][] = [
                [
                    {
                        tileType: TileCategory.Wall,
                        door: { isDoor: false, isOpen: false },
                        isStartingPoint: true,
                        coordinate: { x: 0, y: 0 },
                        isOccupied: false,
                        isHovered: false,
                        alternateCoordinates: { x: 0, y: 0 },
                    },
                ],
            ];

            service.generateMapFromEdition(map);

            expect(service.map.startTiles.length).toBe(1);
            expect(service.map.startTiles[0]).toEqual({ coordinate: { x: 0, y: 0 } });
        });

        it('should handle empty map', () => {
            const map: Cell[][] = [];

            service.generateMapFromEdition(map);

            expect(service.map.doorTiles.length).toBe(0);
            expect(service.map.tiles.length).toBe(0);
            expect(service.map.items.length).toBe(0);
            expect(service.map.startTiles.length).toBe(0);
        });
    });
});
