import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-main-page',
    standalone: true,
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
    imports: [RouterLink],
})
export class MainPageComponent {
    readonly title: string = 'Clash of Tiles';
    logoPath = 'assets/Logo_Clash_of_Tiles.png';
    teamNumber = 'Équipe 109';
    developers = ['Léa Desmars', 'Anis Mehenni', 'Céline Ouchiha', 
        'Thomas Perron Duveau', 'Emelyn Victoria'];

    constructor(private router: Router) {}

    navigateToCreateGame(): void {
        this.router.navigate(['/create-game-page']);
    }

    navigateToAdmin(): void {
        this.router.navigate(['/admin-page']);
    }
}
