import { HttpClient } from '@angular/common/http';
import { Component, Inject, Injectable } from '@angular/core';
import { CommunicationMapService } from '@app/services/communication.map.service';
import html2canvas from 'html2canvas';

@Injectable({
    providedIn: 'root',
})
@Component({
    selector: 'app-screenshot',
    standalone: true,
    imports: [],
    templateUrl: './screenshot.component.html',
    styleUrls: ['./screenshot.component.scss'], // Correction ici
})
export class ScreenShotService {
    constructor(
        @Inject(CommunicationMapService) private communicationService: CommunicationMapService,
        private http: HttpClient,
    ) {}

    async captureAndUpload(mapId: string): Promise<void> {
        try {
            type ImgBBPartialResponse = {
                data: {
                    url: string;
                };
            };
            const element = document.body;
            const canvas = await html2canvas(element);
            const imageBase64 = canvas.toDataURL('image/png');

            const formData = new FormData();
            formData.append('image', imageBase64.split(',')[1]);

            // Utilisation de firstValueFrom pour capturer la première valeur de l'observable
            this.http
                .post<ImgBBPartialResponse>('https://api.imgbb.com/1/upload?expiration=600&key=6cc9c7c4c9f0a1fabb48fe35834d938b', formData)
                .subscribe((response) => {
                    response.data.url.toString();
                    this.communicationService
                        .basicPatch(`admin/edition/${mapId}`, { imagePreview: response.data.url.toString() })
                        .subscribe((response) => console.log(response.body));
                });
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    }

}
