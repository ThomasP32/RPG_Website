import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-map-control-bar',
  standalone: true,
  templateUrl: './map-control-bar.component.html',
  styleUrls: ['./map-control-bar.component.scss'],
  imports: [FormsModule]
})
export class MapControlBarComponent implements OnInit {

  mapTitle: string = 'Default Map Title'; // Titre par défaut
  mapDescription: string = 'This is the default map description.'; // Description par défaut

  isEditingTitle: boolean = false;
  isEditingDescription: boolean = false;

  mode: string;
  gameMode: string = '';
  numberOfPlayers: number = 0;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.getUrlParams();
    this.urlConverter(this.mode);
  }

  toggleEditTitle(): void {
    this.isEditingTitle = !this.isEditingTitle;
  }

  toggleEditDescription(): void {
    this.isEditingDescription = !this.isEditingDescription;
  }

  resetMap(): void {
    this.mapTitle = 'Default Map Title';
    this.mapDescription = 'This is the default map description.';
  }

  createMap(): void {
    alert(`Map Created: ${this.mapTitle} - ${this.mapDescription}`);
  }

  getUrlParams() {
    this.route.queryParams.subscribe((params) => {
        this.mode = this.route.snapshot.params['mode'];
    });
}

  urlConverter(mode: string) {
    console.log('URL params:', mode);
    this.gameMode = mode.split('=')[1];
}
}

