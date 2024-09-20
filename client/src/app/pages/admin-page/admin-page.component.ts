import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-admin-page',
    standalone: true,
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [RouterLink],
})
export class AdminPageComponent implements OnInit {
    readonly title: string = 'Administration des jeux';
    games: any[] = [];
    
    // constructor(private router: Router, private gameService: GameService) {}


    ngOnInit(): void {
        // this.loadGames();
    }

    loadGames(): void {
        // this.gameService.getGames().subscribe((data : any[]) => {
        //     this.games = data.map(game => {
        //         return {
        //             ...game,
        //             showDescription: false,
        //             visible: true
        //         };
        //     });
        // });
    }

    navigateToMain(): void {
        // this.router.navigate(['/home']);
    }

    editGame(): void {
        // this.router.navigate(['/admin/edit-game', this.games.id]);
            
    }

    deleteGame(): void {
        if(confirm('Voulez-vous vraiment supprimer ce jeu ?')) {
            // this.gameService.deleteGame(game.id).subscribe(() => {
            //     this.loadGames();
            // });
        }
    }

    showDescription(): void {
        // game.showDescription = true;
        
    }

    hideDescription(): void {
        // game.showDescription = false
    }
    
    toggleVisibility(): void {
        // const game = this.games.find(g => g.id === game.id);
        // if (game) {
        //     game.visible = !game.visible;
        //     this.gameService.updateGame(game).subscribe(() => {
        //         console.log('Game visibility updated');
        //     });
        // }
    }
}
