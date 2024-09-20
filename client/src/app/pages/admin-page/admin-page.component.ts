import { Component, OnInit } from '@angular/core';
import { CommunicationService } from '@app/services/communication.map.service';
import { RouterLink, Router } from '@angular/router';
import { Map } from '@common/map.types';

@Component({
    selector: 'app-admin-page',
    standalone: true,
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [RouterLink],
})
export class AdminPageComponent implements OnInit {
    readonly title: string = 'Administration des jeux';
    maps: Map[] = [];
    
    constructor(private router: Router, private communicationService: CommunicationService) {
        this.communicationService.maps$.subscribe((maps) => {this.maps = maps});

    }


    ngOnInit(): void {
        this.communicationService.getMapsFromServer();
    }

    // loadGames(): void {
    //     // this.gameService.getGames().subscribe((data : any[]) => {
    //     //     this.games = data.map(game => {
    //     //         return {
    //     //             ...game,
    //     //             showDescription: false,
    //     //             visible: true
    //     //         };
    //     //     });
    //     // });
    // }

    navigateToMain(): void {
        this.router.navigate(['/home']);
    }

    editGame(mapId : string): void {
        this.router.navigate(['/admin/edit-map', mapId]);
            
    }

    deleteGame(): void {
        if(confirm('Voulez-vous vraiment supprimer ce jeu ?')) {
            // this.gameService.deleteGame(game.id).subscribe(() => {
            //     this.loadGames();
            // });
        }
    }

    // showDescription(): void {
        
        
    // }

    // hideDescription(): void {
    //     // game.showDescription = false
    // }
    
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
