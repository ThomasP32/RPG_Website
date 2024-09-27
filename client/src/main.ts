import { provideHttpClient } from '@angular/common/http';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { CharacterFormPageComponent } from '@app/pages/character-form-page/character-form-page.component';
import { GameChoicePageComponent } from '@app/pages/game-choice-page/game-choice-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MaterialPageMapsComponent } from '@app/pages/material-page/material-page-map.component';
import { WaitingRoomPageComponent } from '@app/pages/waiting-room-page/waiting-room-page.component';
import { MapComponent } from 'src/app/components/map/map.component';
import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}

const routes: Routes = [
    { path: '', redirectTo: '/mainmenu', pathMatch: 'full' },
    { path: 'mainmenu', component: MainPageComponent },
    { path: 'map-creation', component: MapComponent },
    // { path: 'game-creation/:size/:mode', component: GameCreationPageComponent },
    { path: 'material', component: MaterialPageMapsComponent },
    { path: 'create-game', component: GameChoicePageComponent },
    { path: 'admin-page', component: AdminPageComponent },
    { path: 'create-character', component: CharacterFormPageComponent },
    { path: 'create-character/:id', component: CharacterFormPageComponent },
    { path: 'waiting-room', component: WaitingRoomPageComponent },
    { path: 'waiting-room/:id', component: WaitingRoomPageComponent },
    { path: '**', redirectTo: '/mainmenu' },
];

bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes), provideAnimations()],
});
