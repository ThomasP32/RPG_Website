/* eslint-disable */
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { ScreenShotService } from './screenshot.service';

describe('ScreenShotService', () => {
    let service: ScreenShotService;
    let httpMock: HttpTestingController;
    let captureElementToCanvasSpy: jasmine.Spy;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ScreenShotService],
        });

        service = TestBed.inject(ScreenShotService);
        httpMock = TestBed.inject(HttpTestingController);

        // Mock the captureElementToCanvas function
        captureElementToCanvasSpy = spyOn(service, 'captureElementToCanvas').and.returnValue(
            Promise.resolve(CanvasTestHelper.createCanvas(100, 100)),
        );
    });

    afterEach(() => {
        httpMock.verify(); // Ensure that there are no outstanding requests
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    it('should successfully capture an element to a canvas', async () => {
        const mockCanvas = CanvasTestHelper.createCanvas(100, 100);
        captureElementToCanvasSpy.and.returnValue(Promise.resolve(mockCanvas));

        const fakeElement = document.createElement('div');
        fakeElement.id = 'success-element';
        document.body.appendChild(fakeElement);

        const canvas = await service.captureElementToCanvas(fakeElement);

        expect(canvas).toBeTruthy();
        expect(canvas).toEqual(mockCanvas);

        document.body.removeChild(fakeElement);
    });

    it('should throw an error if the element is not found', async () => {
        await expectAsync(service.captureAndUpload('invalid-id')).toBeRejectedWithError('Element with ID not found.');
    });

    it('should convert a canvas to base64', () => {
        const canvas = CanvasTestHelper.createCanvas(100, 100);
        const base64 = service.convertCanvasToBase64(canvas);
        expect(base64).toMatch(/^data:image\/png;base64,iVBOR/); // Basic check to ensure it's a base64 PNG
    });

    it('should upload the image successfully', async () => {
        const fakeCanvas = CanvasTestHelper.createCanvas(100, 100);
        const base64Image = service.convertCanvasToBase64(fakeCanvas);
        const uploadPromise = service.uploadImage(base64Image);

        const req = httpMock.expectOne((request) => request.url === 'https://api.imgbb.com/1/upload' && request.method === 'POST');
        expect(req.request.method).toBe('POST');
        req.flush({ data: { url: 'https://fakeimageurl.com' } });

        await expectAsync(uploadPromise).toBeResolvedTo('https://fakeimageurl.com');
    });

    it('should throw an error if uploading the image fails', async () => {
        const fakeCanvas = CanvasTestHelper.createCanvas(100, 100);
        const base64Image = service.convertCanvasToBase64(fakeCanvas);
        const uploadPromise = service.uploadImage(base64Image);

        const req = httpMock.expectOne((request) => request.url === 'https://api.imgbb.com/1/upload' && request.method === 'POST');
        expect(req.request.method).toBe('POST');
        req.error(new ErrorEvent('Network error'));

        await expectAsync(uploadPromise).toBeRejectedWithError('Error uploading image');
    });

    it('should handle canvas creation error', async () => {
        const fakeElement = document.createElement('div');
        fakeElement.id = 'capture-zone';
        document.body.appendChild(fakeElement);

        captureElementToCanvasSpy.and.returnValue(Promise.reject(new Error('Canvas creation error')));

        await expectAsync(service.captureAndUpload('capture-zone')).toBeRejectedWithError('Canvas creation error');

        document.body.removeChild(fakeElement);
    });

    it('should handle base64 conversion error', async () => {
        spyOn(service, 'convertCanvasToBase64').and.throwError('Base64 conversion error');

        const fakeElement = document.createElement('div');
        fakeElement.id = 'capture-zone';
        document.body.appendChild(fakeElement);

        await expectAsync(service.captureAndUpload('capture-zone')).toBeRejectedWithError('Base64 conversion error');

        document.body.removeChild(fakeElement);
    });

    it('should handle canvas creation and upload', async () => {
        const fakeElement = document.createElement('div');
        fakeElement.id = 'capture-zone';
        document.body.appendChild(fakeElement);

        const fakeCanvas = CanvasTestHelper.createCanvas(100, 100);
        captureElementToCanvasSpy.and.returnValue(Promise.resolve(fakeCanvas));

        const base64Image = service.convertCanvasToBase64(fakeCanvas);
        const uploadPromise = service.uploadImage(base64Image);

        const req = httpMock.expectOne((request) => request.url === 'https://api.imgbb.com/1/upload' && request.method === 'POST');
        expect(req.request.method).toBe('POST');
        req.flush({ data: { url: 'https://fakeimageurl.com' } });

        await expectAsync(uploadPromise).toBeResolvedTo('https://fakeimageurl.com');

        document.body.removeChild(fakeElement);
    });
});
