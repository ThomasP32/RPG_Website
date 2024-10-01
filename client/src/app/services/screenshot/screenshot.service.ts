import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ScreenShotService {
    private readonly imgbbUploadUrl = 'https://api.imgbb.com/1/upload';
    private readonly apiKey = '6cc9c7c4c9f0a1fabb48fe35834d938b';

    constructor(private http: HttpClient) {}

    async captureAndUpload(mapContainerId: string): Promise<string> {
        const element = document.getElementById(mapContainerId);
        if (!element) {
            throw new Error('Element with ID not found.');
        }

        const canvas = await this.captureElementToCanvas(element);
        const base64Image = this.convertCanvasToBase64(canvas);
        return await this.uploadImage(base64Image);
    }

    async captureElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
        return await html2canvas(element);
    }

    convertCanvasToBase64(canvas: HTMLCanvasElement): string {
        return canvas.toDataURL('image/png');
    }

    async uploadImage(base64Image: string): Promise<string> {
        const base64ImageData = base64Image.split(',')[1];

        const formData = new FormData();
        formData.append('key', this.apiKey);
        formData.append('image', base64ImageData);

        try {
            const response = await firstValueFrom(this.http.post<{ data: { url: string } }>(this.imgbbUploadUrl, formData));
            return response.data.url;
        } catch (error) {
            throw new Error('Error uploading image');
        }
    }
}
