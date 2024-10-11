import { Injectable } from '@angular/core';
import { Html2CanvasWrapperService } from './html2canvaswrapper.service';

@Injectable({
    providedIn: 'root',
})
export class ScreenShotService {
    /* eslint-disable-next-line no-unused-vars */
    constructor(private html2CanvasWrapper: Html2CanvasWrapperService) {}

    async captureAndConvert(mapContainerId: string): Promise<string> {
        const element = document.getElementById(mapContainerId);
        if (!element) {
            throw new Error('Element with ID not found.');
        }

        const canvas = await this.html2CanvasWrapper.getCanvas(element);
        return this.convertCanvasToBase64(canvas);
    }

    convertCanvasToBase64(canvas: HTMLCanvasElement): string {
        return canvas.toDataURL('image/jpeg', 0.09);
    }

}
