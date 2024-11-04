import { TestBed } from '@angular/core/testing';
import { Html2CanvasWrapperService } from '@app/services/screenshot/html2canvaswrapper.service';

describe('Html2CanvasWrapperService', () => {
    let service: Html2CanvasWrapperService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [Html2CanvasWrapperService],
        });

        service = TestBed.inject(Html2CanvasWrapperService);
    });

    beforeAll(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 24 * 60 * 60 * 1000;
      });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    it('should call html2canvas and return a canvas without premature timeout', async () => {
        const mockElement = document.createElement('div');
        document.body.appendChild(mockElement);
        

        const canvas = await service.getCanvas(mockElement);
        expect(canvas).toBeInstanceOf(HTMLCanvasElement);

        document.body.removeChild(mockElement);
    });
});
