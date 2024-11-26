import { provideHttpClient } from '@angular/common/http';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter, withHashLocation } from '@angular/router';
import { ActionsComponentComponent } from '@app/components/actions-component/actions-component.component';
import { PlayerInfosComponent } from '@app/components/player-infos/player-infos.component';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { CharacterFormPageComponent } from '@app/pages/character-form-page/character-form-page.component';
import { EndgamePageComponent } from '@app/pages/endgame-page/endgame-page.component';
import { GameChoicePageComponent } from '@app/pages/game-choice-page/game-choice-page.component';
import { GameCreationPageComponent } from '@app/pages/game-creation-page/game-creation-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page';
import { HomePageComponent } from '@app/pages/home-page/home-page.component';
import { MockGamePageComponent } from '@app/pages/mock-game-page/mock-game-page.component';
import { WaitingRoomPageComponent } from '@app/pages/waiting-room-page/waiting-room-page.component';
import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}

const routes: Routes = [
    { path: '', redirectTo: '/main-menu', pathMatch: 'full' },
    { path: 'main-menu', component: HomePageComponent },
    { path: 'creation', component: GameCreationPageComponent },
    { path: 'edition/:id', component: GameCreationPageComponent },
    { path: 'create-game', component: GameChoicePageComponent },
    { path: 'admin-page', component: AdminPageComponent },
    { path: ':gameId/choose-character', component: CharacterFormPageComponent },
    { path: 'create-game/:mapName/create-character', component: CharacterFormPageComponent },
    { path: ':mapName/waiting-room/host', component: WaitingRoomPageComponent },
    { path: 'end-game', component: EndgamePageComponent },
    { path: 'join-game/:gameId/create-character', component: CharacterFormPageComponent },
    { path: ':gameId/waiting-room/player', component: WaitingRoomPageComponent },
    { path: 'join-game/:gameId/waiting-room', component: WaitingRoomPageComponent },
    { path: 'game/:gameId/:mapName', component: GamePageComponent },
    { path: 'mock-game', component: MockGamePageComponent },
    { path: 'players-info', component: PlayerInfosComponent },
    { path: 'actions', component: ActionsComponentComponent },
    { path: '**', redirectTo: '/main-menu' },
];

bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes, withHashLocation()), provideAnimations()],
});
