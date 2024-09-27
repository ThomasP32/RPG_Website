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
    teamNumber = 'Équipe 109';
<<<<<<< HEAD
    developers = ['Léa Desmars', 'Anis Mehenni', 'Céline Ouchiha', 
        'Thomas Perron Duveau', 'Emlyn Murphy'];
=======
    developers = ['Léa Desmars', 'Anis Mehenni', 'Céline Ouchiha', 'Thomas Perron Duveau', 'Emelyn Victoria'];
>>>>>>> dev

    constructor(private router: Router) {}

    navigateToCreateGame(): void {
        this.router.navigate(['/create-game']);
    }

    navigateToAdmin(): void {
        this.router.navigate(['/admin-page']);
    }
}
