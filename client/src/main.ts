import { provideHttpClient } from '@angular/common/http';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter } from '@angular/router';
import { AppComponent } from '@app/pages/app/app.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page-game.component';
import { MaterialPageGameComponent } from '@app/pages/material-page/material-page-game.component';
import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}


const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'game', component: GamePageComponent },
    { path: 'material', component: MaterialPageGameComponent },
    { path: '**', redirectTo: '/home' },
];

bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes), provideAnimations()],
})
