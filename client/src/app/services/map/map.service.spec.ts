import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Map, Mode } from '@common/map.types';
import { of, throwError } from 'rxjs';
import { MapService } from '@app/services/map/map.service';

describe('MapService', () => {
    let service: MapService;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationMapService>;
    let mockMap: Map;

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
        TestBed.configureTestingModule({
            providers: [MapService, { provide: CommunicationMapService, useValue: communicationServiceSpy }],
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

        service.updateSelectedTile('wall');
        expect(selectedTile).toBe('wall');

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
});
