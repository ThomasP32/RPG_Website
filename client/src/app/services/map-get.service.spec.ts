import { TestBed } from '@angular/core/testing';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { Map, Mode } from '@common/map.types';
import { of } from 'rxjs';
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
        communicationServiceSpy.basicGet.and.returnValue(of(mockMap));

        await service.getMap('1');

        expect(communicationServiceSpy.basicGet).toHaveBeenCalledOnceWith('admin/1');
        expect(service.map).toEqual(mockMap);
    });
});
