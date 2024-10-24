import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { JoinGameModalComponent } from '@app/components/join-game-modal/join-game-modal.component';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
/* eslint-disable no-unused-vars */
@Component({
    selector: 'app-main-page',
    standalone: true,
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    imports: [RouterLink, JoinGameModalComponent],
})
export class HomePageComponent implements OnInit {
    teamNumber = 'Équipe 109';
    developers = ['Léa Desmars', 'Anis Mehenni', 'Céline Ouchiha', 'Thomas Perron Duveau', 'Emlyn Murphy'];
    showJoinGameModal = false;
    isJoinGameModalVisible = false;

    constructor(
        private router: Router,
        public socketService: SocketService,
    ) {}

    ngOnInit(): void {
        this.connect();
    }

    // TODO:ca normalement ca ne devrait pas être necessaire sinon ca bloque la connexion seulement aux utilisateurs qui
    // ont accédé au jeu a partir de la page d'acceuil
    get socketId() {
        return this.socketService.socket && this.socketService.socket.id ? this.socketService.socket.id : '';
    }

    async connect() {
        if (!this.socketService.isSocketAlive()) {
            this.socketService.connect();
        }
    }

    toggleJoinGameVisibility(): void {
        this.isJoinGameModalVisible = true;
    }

    onCloseModal(): void {
        this.isJoinGameModalVisible = false;
    }

    navigateToCreateGame(): void {
        this.router.navigate(['/create-game']);
    }

    navigateToAdmin(): void {
        this.router.navigate(['/admin-page']);
    }
}
