import { TestBed } from '@angular/core/testing';
import { Map, Mode } from '@common/map.types';
import { of } from 'rxjs';
import { CommunicationMapService } from './communication.map.service';
import { MapGetService } from './map-get.service';

describe('MapGetService', () => {
    let service: MapGetService;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationMapService>;

    beforeEach(() => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationMapService', ['basicGet']);

        TestBed.configureTestingModule({
            providers: [MapGetService, { provide: CommunicationMapService, useValue: communicationServiceSpy }],
        });
        service = TestBed.inject(MapGetService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get map by ID', async () => {
        const mockMap: Map = {
            _id: '1',
            name: 'Test Map',
            isVisible: true,
            mapSize: { x: 10, y: 10 },
            startTiles: [],
            items: [],
            doorTiles: [],
            tiles: [],
            description: '',
            imagePreview: '',
            mode: Mode.Classic,
        };
        communicationServiceSpy.basicGet.and.returnValue(of(mockMap));

        await service.getMap('1');

        expect(communicationServiceSpy.basicGet).toHaveBeenCalledOnceWith('admin/1');
        expect(service.map).toEqual(mockMap);
    });

    it('should handle error when getting map', async () => {
        communicationServiceSpy.basicGet.and.returnValue(await Promise.reject('API error'));

        try {
            await service.getMap('1');
        } catch (error) {
            expect(error).toBe('API error');
        }

        expect(communicationServiceSpy.basicGet).toHaveBeenCalledOnceWith('admin/1');
        // Add an assertion to check how you handle errors (e.g., expect a specific property to be set)
    });
});
