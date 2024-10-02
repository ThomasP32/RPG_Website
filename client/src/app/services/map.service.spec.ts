import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { DBMap as Map, Mode } from '@common/map.types';
import { of, throwError } from 'rxjs';
import { MapService } from './map.service';

describe('MapService', () => {
    let service: MapService;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationMapService>;

    beforeEach(() => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['basicPost', 'basicPatch']);
        TestBed.configureTestingModule({
            providers: [MapService, { provide: CommunicationMapService, useValue: communicationServiceSpy }],
        });
        service = TestBed.inject(MapService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set map title', () => {
        let title = '';
        service.mapTitle$.subscribe((newTitle) => (title = newTitle));
        service.setMapTitle('Test Title');
        expect(title).toBe('Test Title');
    });

    it('should set map description', () => {
        let description = '';
        service.mapDescription$.subscribe((newDescription) => (description = newDescription));
        service.setMapDescription('Test Description');
        expect(description).toBe('Test Description');
    });

    it('should trigger generate map data', () => {
        spyOn(service.generateMapSource, 'next');
        service.generateMapData();
        expect(service.generateMapSource.next).toHaveBeenCalled();
    });

    it('should trigger reset map', () => {
        spyOn(service.resetMapSource, 'next');
        service.resetMap();
        expect(service.resetMapSource.next).toHaveBeenCalled();
    });

    it('should save new map', () => {
        const mockMap: Map = {
            name: 'Test Map',
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
            description: '',
            imagePreview: '',
            mode: Mode.Ctf,
            _id: '1',
            isVisible: false,
            lastModified: new Date(),
        };
        communicationServiceSpy.basicPost.and.returnValue(of(new HttpResponse({ body: 'response' })));

        service.saveNewMap(mockMap);

        expect(communicationServiceSpy.basicPost).toHaveBeenCalledOnceWith('admin/creation', mockMap);
    });

    it('should save edited map', () => {
        const mockMap: Map = {
            name: 'Test Map',
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
            description: '',
            imagePreview: '',
            mode: Mode.Classic,
            _id: '1',
            isVisible: false,
            lastModified: new Date(),
        };

        const id = '1';

        communicationServiceSpy.basicPatch.and.returnValue(of(new HttpResponse({ body: 'response' })));

        service.updateMap(mockMap, id);

        expect(communicationServiceSpy.basicPatch).toHaveBeenCalledOnceWith('admin/edition/1', mockMap);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should update selected tile', () => {
        let selectedTile = '';
        service.updateSelectedTileSource.subscribe((tile) => (selectedTile = tile)); // Subscribe directly to the BehaviorSubject

        service.updateSelectedTile('wall');
        expect(selectedTile).toBe('wall');

        service.updateSelectedTile('door');
        expect(selectedTile).toBe('door');
    });

    it('should handle HttpErrorResponse with JSON error body for saveNewMap', async () => {
        const mockMap: Map = {
            name: 'Test Map',
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
            description: '',
            imagePreview: '',
            mode: Mode.Classic,
            _id: '1',
            isVisible: false,
            lastModified: new Date(),
        };

        const errorResponse = new HttpErrorResponse({
            status: 400,
            error: JSON.stringify({ message: 'Test error message' }),
        });

        communicationServiceSpy.basicPost.and.returnValue(throwError(() => errorResponse));

        const result = await service.saveNewMap(mockMap);
        expect(result).toBe('Test error message');
    });

    it('should handle HttpErrorResponse with non-JSON error body for saveNewMap', async () => {
        const mockMap: Map = {
            name: 'Test Map',
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
            description: '',
            imagePreview: '',
            mode: Mode.Classic,
            _id: '1',
            isVisible: false,
            lastModified: new Date(),
        };

        const errorResponse = new HttpErrorResponse({
            status: 400,
            error: 'Non-JSON error message',
        });

        communicationServiceSpy.basicPost.and.returnValue(throwError(() => errorResponse));

        const result = await service.saveNewMap(mockMap);
        expect(result).toBe('Erreur innatendue, veuillez réessayer plus tard...');
    });

    it('should handle unknown error type for saveNewMap', async () => {
        const mockMap: Map = {
            name: 'Test Map',
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
            description: '',
            imagePreview: '',
            mode: Mode.Classic,
            _id: '1',
            isVisible: false,
            lastModified: new Date(),
        };

        const unknownError = new Error('Unknown error');

        communicationServiceSpy.basicPost.and.returnValue(throwError(() => unknownError));

        const result = await service.saveNewMap(mockMap);
        expect(result).toBe('Erreur inconnue, veuillez réessayer plus tard...');
    });

    it('should save new map successfully', async () => {
        const mockMap: Map = {
            name: 'Test Map',
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
            description: '',
            imagePreview: '',
            mode: Mode.Classic,
            _id: '1',
            isVisible: false,
            lastModified: new Date(),
        };

        communicationServiceSpy.basicPost.and.returnValue(of(new HttpResponse({ body: 'response' })));

        const result = await service.saveNewMap(mockMap);
        expect(result).toBe('Votre jeu a été sauvegardé avec succès!');
    });

    it('should handle HttpErrorResponse with JSON error body for updateMap', async () => {
        const mockMap: Map = {
            name: 'Test Map',
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
            description: '',
            imagePreview: '',
            mode: Mode.Classic,
            _id: '1',
            isVisible: false,
            lastModified: new Date(),
        };

        const errorResponse = new HttpErrorResponse({
            status: 400,
            error: JSON.stringify({ message: ['Test error message'] }),
        });

        communicationServiceSpy.basicPatch.and.returnValue(throwError(() => errorResponse));

        const result = await service.updateMap(mockMap, '1');
        expect(result).toBe('Test error message');
    });

    it('should handle HttpErrorResponse with non-JSON error body for updateMap', async () => {
        const mockMap: Map = {
            name: 'Test Map',
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
            description: '',
            imagePreview: '',
            mode: Mode.Classic,
            _id: '1',
            isVisible: false,
            lastModified: new Date(),
        };

        const errorResponse = new HttpErrorResponse({
            status: 400,
            error: 'Non-JSON error message',
        });

        communicationServiceSpy.basicPatch.and.returnValue(throwError(() => errorResponse));

        const result = await service.updateMap(mockMap, '1');
        expect(result).toBe('Erreur innatendue, veuillez réessayer plus tard...');
    });

    it('should handle unknown error type for updateMap', async () => {
        const mockMap: Map = {
            name: 'Test Map',
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
            description: '',
            imagePreview: '',
            mode: Mode.Classic,
            _id: '1',
            isVisible: false,
            lastModified: new Date(),
        };

        const unknownError = new Error('Unknown error');

        communicationServiceSpy.basicPatch.and.returnValue(throwError(() => unknownError));

        const result = await service.updateMap(mockMap, '1');
        expect(result).toBe('Erreur inconnue, veuillez réessayer plus tard...');
    });

    it('should handle HttpErrorResponse with array of messages for saveNewMap', async () => {
        const mockMap: Map = {
            name: 'Test Map',
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
            description: '',
            imagePreview: '',
            mode: Mode.Classic,
            _id: '1',
            isVisible: false,
            lastModified: new Date(),
        };

        const errorResponse = new HttpErrorResponse({
            status: 400,
            error: JSON.stringify({ message: ['Error part 1', ' and error part 2'] }),
        });

        communicationServiceSpy.basicPost.and.returnValue(throwError(() => errorResponse));

        const result = await service.saveNewMap(mockMap);
        expect(result).toBe('Error part 1 and error part 2');
    });

    it('should handle HttpErrorResponse with array of messages for updateMap', async () => {
        const mockMap: Map = {
            name: 'Test Map',
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
            description: '',
            imagePreview: '',
            mode: Mode.Classic,
            _id: '1',
            isVisible: false,
            lastModified: new Date(),
        };

        const errorResponse = new HttpErrorResponse({
            status: 400,
            error: JSON.stringify({ message: ['Error part 1', ' and error part 2'] }),
        });

        communicationServiceSpy.basicPatch.and.returnValue(throwError(() => errorResponse));

        const result = await service.updateMap(mockMap, '1');
        expect(result).toBe('Error part 1 and error part 2');
    });
    
});

