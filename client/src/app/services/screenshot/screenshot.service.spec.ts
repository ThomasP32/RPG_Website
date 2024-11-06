import { TestBed } from '@angular/core/testing';
import { ScreenShotService } from './screenshot.service';
import { Html2CanvasWrapperService } from '@app/services/screenshot/html2canvaswrapper.service';
import { CanvasTestHelper } from '@app/services/screenshot/classes/canvas-test-helper';

describe('ScreenShotService', () => {
    let service: ScreenShotService;
    let html2CanvasWrapperSpy: jasmine.SpyObj<Html2CanvasWrapperService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('Html2CanvasWrapperService', ['getCanvas']);

        TestBed.configureTestingModule({
            providers: [
                ScreenShotService,
                { provide: Html2CanvasWrapperService, useValue: spy },
            ],
        });

        service = TestBed.inject(ScreenShotService);
        html2CanvasWrapperSpy = TestBed.inject(Html2CanvasWrapperService) as jasmine.SpyObj<Html2CanvasWrapperService>;

        html2CanvasWrapperSpy.getCanvas.and.returnValue(Promise.resolve(CanvasTestHelper.createCanvas(100, 100)));
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    it('should throw an error if the element is not found', async () => {
        await expectAsync(service.captureAndConvert('invalid-id')).toBeRejectedWithError('Element with ID not found.');
    });

    it('should call getCanvas on Html2CanvasWrapperService and convert the canvas to base64', async () => {
        const fakeElement = document.createElement('div');
        fakeElement.id = 'capture-zone';
        document.body.appendChild(fakeElement);

        const base64Image = await service.captureAndConvert('capture-zone');

        expect(html2CanvasWrapperSpy.getCanvas).toHaveBeenCalledWith(fakeElement);
        expect(base64Image).toMatch(/^data:image\/jpeg;base64,/);

        document.body.removeChild(fakeElement);
    });

    it('should convert the canvas to base64 with expected quality', () => {
        const canvas = CanvasTestHelper.createCanvas(100, 100);
        const base64 = service.convertCanvasToBase64(canvas);
        expect(base64).toMatch(/^data:image\/jpeg;base64,/);
    });
});
