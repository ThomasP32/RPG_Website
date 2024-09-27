import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import html2canvas from 'html2canvas';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-screenshot',
  standalone: true,
  imports: [],
  templateUrl: './screenshot.component.html',
  styleUrls: ['./screenshot.component.scss']  // Correction ici
})
export class ScreenshotComponent {

  constructor(private http: HttpClient) {}

  async captureAndUpload(): Promise<void> {  // Correction ici
    try {
      const element = document.body;
      const canvas = await html2canvas(element);
      const imageBase64 = canvas.toDataURL('image/png');

      const formData = new FormData();
      formData.append('image', imageBase64.split(',')[1]);

      // Utilisation de firstValueFrom pour capturer la première valeur de l'observable
      const response: any = await firstValueFrom(
        this.http.post('https://api.imgbb.com/1/upload?expiration=600&key=6cc9c7c4c9f0a1fabb48fe35834d938b', formData)
      );
      console.log('Image uploaded, URL:', response.data.url);
      
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }
}
