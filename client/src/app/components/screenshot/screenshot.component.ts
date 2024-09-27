import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { CommunicationMapService } from '@app/services/communication.map.service';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-screenshot',
  standalone: true,
  imports: [],
  templateUrl: './screenshot.component.html',
  styleUrls: ['./screenshot.component.scss']  // Correction ici
})
export class ScreenshotComponent {

  constructor(@Inject(CommunicationMapService) private communicationService: CommunicationMapService, private http: HttpClient) {}

  async captureAndUpload(mapId: string): Promise<void> {  // Correction ici
    try {
      type ImgBBPartialResponse = {
        data: {
          url: string;
        };}
      const element = document.body;
      const canvas = await html2canvas(element);
      const imageBase64 = canvas.toDataURL('image/png');

      const formData = new FormData();
      formData.append('image', imageBase64.split(',')[1]);

      // Utilisation de firstValueFrom pour capturer la première valeur de l'observable
      this.http.post<ImgBBPartialResponse>('https://api.imgbb.com/1/upload?expiration=600&key=6cc9c7c4c9f0a1fabb48fe35834d938b', formData).subscribe(
        response => { response.data.url.toString(); this.communicationService.basicPatch(`admin/edition/${mapId}`, { "imagePreview": response.data.url.toString() }).subscribe(response => console.log(response.body));
      });
      
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }

  displayImage(imageUrl: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // Permet d'éviter les erreurs CORS si le serveur le permet.
      img.src = imageUrl;
  
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
  
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png'); // Convertir l'image en base64
          resolve(dataURL.split(',')[1]); // Retourner uniquement la partie base64
        } else {
          reject(new Error('Erreur lors de la création du contexte du canvas'));
        }
      };
  
      img.onerror = (error) => {
        reject(new Error('Erreur lors du chargement de l\'image : ' + error));
      };
    });
  }
  
}
