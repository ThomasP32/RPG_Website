import { provideHttpClient } from '@angular/common/http';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { CharacterFormPageComponent } from '@app/pages/character-form-page/character-form-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { GameCreationPageComponent } from '@app/pages/map-creation-page/game-creation-page.component';
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
    { path: 'game-creation/:size/:mode', component: GameCreationPageComponent },
    { path: 'material', component: MaterialPageComponent },
    // { path: 'material', component: MaterialPageMapsComponent },
    // { path: 'create-game', component: StartGamePageComponent },
    { path: 'admin-page', component: AdminPageComponent },
    { path: 'create-character', component: CharacterFormPageComponent },
    { path: '**', redirectTo: '/home' },
];

bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes), provideAnimations()],
});
