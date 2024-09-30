import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Map, Mode } from '@common/map.types';
import { of } from 'rxjs';
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

    it('should update starting point counter', () => {
        let counter = 0;
        service.startingPointCounter$.subscribe((value) => (counter = value));
        service.updateStartingPointCounter(5);
        expect(counter).toBe(5);
    });

    it('should update random item counter', () => {
        let counter = 0;
        service.randomItemCounter$.subscribe((value) => (counter = value));
        service.updateRandomItemCounter(10);
        expect(counter).toBe(10);
    });

    it('should update items counter', () => {
        let counter = 0;
        service.itemsCounter$.subscribe((value) => (counter = value));
        service.updateItemsCounter(8);
        expect(counter).toBe(8);
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
        };
        communicationServiceSpy.basicPatch.and.returnValue(of(new HttpResponse({ body: {} })));

        service.saveEditedMap(mockMap);

        expect(communicationServiceSpy.basicPatch).toHaveBeenCalledOnceWith('admin/edition', mockMap);
    });
});
