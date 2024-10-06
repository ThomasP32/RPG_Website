import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';

@Injectable({
    providedIn: 'root',
})
export class Html2CanvasWrapperService {
    getCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
        return html2canvas(element);
    }
}
