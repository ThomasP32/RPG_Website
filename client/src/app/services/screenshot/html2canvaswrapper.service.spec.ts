import { TestBed } from '@angular/core/testing';
import { Html2CanvasWrapperService } from './html2canvaswrapper.service';


// affiche l'erreur Unable to find element in cloned iframe thrown
describe('Html2CanvasWrapperService', () => {
    let service: Html2CanvasWrapperService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [Html2CanvasWrapperService],
        });

        service = TestBed.inject(Html2CanvasWrapperService);

    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    // it('should call html2canvas and return a canvas', async () => {
    //     const fakeElement = document.createElement('div');

    //     const canvas = await service.getCanvas(fakeElement);
    //     expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    // });

});
