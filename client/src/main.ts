import { provideHttpClient } from '@angular/common/http';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter } from '@angular/router';
import { AppComponent } from '@app/pages/app/app.component';
import { GameCreationPageComponent } from '@app/pages/game-creation-page/game-creation-page/game-creation-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';
import { MapComponent } from 'src/app/components/map/map.component';
import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'game', component: GamePageComponent },
    { path: 'map-creation', component: MapComponent },
    { path: 'game-creation/:mapSize/:mode', component: GameCreationPageComponent },
    { path: 'material', component: MaterialPageComponent },
    { path: '**', redirectTo: '/game-creation' },
];

bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes), provideAnimations()],
});
