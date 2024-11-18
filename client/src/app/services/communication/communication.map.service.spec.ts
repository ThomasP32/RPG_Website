import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DetailedMap, ItemCategory, Mode, TileCategory } from '@common/map.types';
import { environment } from 'src/environments/environment';
import { CommunicationMapService } from './communication.map.service';

const mockResponse: DetailedMap = {
    _id: { $oid: '507f1f77bcf86cd799439011' },
    name: 'Test Map',
    description: 'A test map description',
    imagePreview: 'image-url',
    mode: Mode.Ctf,
    isVisible: true,
    mapSize: { x: 10, y: 10 },
    startTiles: [{ coordinate: { x: 1, y: 1 } }],
    items: [{ coordinate: { x: 2, y: 2 }, category: ItemCategory.Armor }],
    doorTiles: [{ coordinate: { x: 3, y: 3 }, isOpened: false }],
    tiles: [{ coordinate: { x: 0, y: 0 }, category: TileCategory.Water }],
    lastModified: new Date(),
};

describe('CommunicationMapService', () => {
    let service: CommunicationMapService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
        });
        service = TestBed.inject(CommunicationMapService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should perform a GET request', () => {
        service.basicGet<DetailedMap>('map/test').subscribe((response) => {
            expect(response).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${environment.serverUrl}/map/test`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });

    it('should handle GET request error', () => {
        service.basicGet<DetailedMap>('map/test').subscribe((response) => {
            expect(response).toBeUndefined();
        });

        const req = httpMock.expectOne(`${environment.serverUrl}/map/test`);
        req.error(new ErrorEvent('Network error'));
    });

    it('should perform a POST request', () => {
        const mockMap: DetailedMap = { ...mockResponse };

        service.basicPost('map', mockMap).subscribe((response) => {
            expect(response.body).toBe('Success');
        });

        const req = httpMock.expectOne(`${environment.serverUrl}/map`);
        expect(req.request.method).toBe('POST');
        req.flush('Success', { status: 200, statusText: 'OK' });
    });

    it('should perform a PATCH request', () => {
        service.basicPatch('map', mockResponse).subscribe((response) => {
            expect(response.body).toBe('Success');
        });

        const req = httpMock.expectOne(`${environment.serverUrl}/map`);
        expect(req.request.method).toBe('PATCH');
        req.flush('Success', { status: 200, statusText: 'OK' });
    });

    it('should perform a PUT request', () => {
        service.basicPut('map', mockResponse).subscribe((response) => {
            expect(response.body).toBe('Success');
        });

        const req = httpMock.expectOne(`${environment.serverUrl}/map`);
        expect(req.request.method).toBe('PUT');
        req.flush('Success', { status: 200, statusText: 'OK' });
    });

    it('should perform a DELETE request', () => {
        service.basicDelete('map/test').subscribe((response) => {
            expect(response.body).toBe('Success');
        });

        const req = httpMock.expectOne(`${environment.serverUrl}/map/test`);
        expect(req.request.method).toBe('DELETE');
        req.flush('Success', { status: 200, statusText: 'OK' });
    });
});
