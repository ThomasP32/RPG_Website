import { provideHttpClient } from '@angular/common/http';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { CharacterFormPageComponent } from '@app/pages/character-form-page/character-form-page.component';
import { HomePageComponent } from '@app/pages/home-page/home-page.component';
import { GameCreationPageComponent } from '@app/pages/map-creation-page/game-creation-page.component';
import { MaterialPageMapsComponent } from '@app/pages/material-page/material-page-map.component';
import { StartGamePageComponent } from '@app/pages/start-game-page/start-game-page.component';
import { GameChoicePageComponent } from '@app/pages/game-choice-page/game-choice-page.component';
import { WaitingRoomPageComponent } from '@app/pages/waiting-room-page/waiting-room-page.component';
import { MapComponent } from 'src/app/components/map/map.component';
import { environment } from './environments/environment';


if (environment.production) {
    enableProdMode();
}

const routes: Routes = [
    { path: '', redirectTo: '/main-menu', pathMatch: 'full' },
    { path: 'main-menu', component: HomePageComponent },
    { path: 'map-creation', component: MapComponent },
    // { path: 'game-creation/:size/:mode', component: GameCreationPageComponent },
    { path: 'create-game', component: GameChoicePageComponent },
    { path: 'admin-page', component: AdminPageComponent },
    { path: 'create-character', component: CharacterFormPageComponent },
    { path: 'create-character/:id', component: CharacterFormPageComponent },
    { path: 'waiting-room', component: WaitingRoomPageComponent },
    { path: 'waiting-room/:id', component: WaitingRoomPageComponent },
    { path: '**', redirectTo: '/main-menu' },
];

bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes), provideAnimations()],
});
