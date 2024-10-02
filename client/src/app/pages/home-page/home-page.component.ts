import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
/* eslint-disable no-unused-vars */
@Component({
    selector: 'app-main-page',
    standalone: true,
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    imports: [RouterLink],
})
export class HomePageComponent {
    teamNumber = 'Équipe 109';
    developers = ['Léa Desmars', 'Anis Mehenni', 'Céline Ouchiha', 'Thomas Perron Duveau', 'Emlyn Murphy'];

    constructor(private router: Router) {}

    navigateToCreateGame(): void {
        this.router.navigate(['/create-game']);
    }

    navigateToAdmin(): void {
        this.router.navigate(['/admin-page']);
    }
}
