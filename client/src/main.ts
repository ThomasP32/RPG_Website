import { provideHttpClient } from '@angular/common/http';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter } from '@angular/router';
import { WaitingRoomComponent } from '@app/components/waiting-room/waiting-room.component';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { CharacterFormPageComponent } from '@app/pages/character-form-page/character-form-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { GameCreationPageComponent } from '@app/pages/map-creation-page/game-creation-page.component';
import { MaterialPageMapsComponent } from '@app/pages/material-page/material-page-map.component';
import { StartGamePageComponent } from '@app/pages/start-game-page/start-game-page.component';
import { MapComponent } from 'src/app/components/map/map.component';
import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}

const routes: Routes = [
    { path: '', redirectTo: '/mainmenu', pathMatch: 'full' },
    { path: 'mainmenu', component: MainPageComponent },
    { path: 'map-creation', component: MapComponent },
    { path: 'game-creation/:size/:mode', component: GameCreationPageComponent },
    { path: 'material', component: MaterialPageMapsComponent },
    { path: 'create-game', component: StartGamePageComponent },
    { path: 'admin-page', component: AdminPageComponent },
    { path: 'create-character', component: CharacterFormPageComponent },
    { path: 'waiting-room', component: WaitingRoomComponent },
    { path: '**', redirectTo: '/mainmenu' },
];

bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes), provideAnimations()],
});
