import { Injectable } from '@angular/core';
import { Html2CanvasWrapperService } from '@app/services/screenshot/html2canvaswrapper.service';

@Injectable({
    providedIn: 'root',
})
export class ScreenShotService {

    constructor(private html2CanvasWrapper: Html2CanvasWrapperService) {
        this.html2CanvasWrapper = html2CanvasWrapper;
    }

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
