import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Player } from '@common/game';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CombatService {
    defaultPlayer: Player = {
        socketId: '',
        name: '',
        avatar: 1,
        isActive: false,
        specs: {
            life: 0,
            speed: 0,
            attack: 0,
            defense: 0,
            attackBonus: 4,
            defenseBonus: 4,
            movePoints: 0,
            actions: 0,
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
            nEvasions: 0,
            nLifeTaken: 0,
            nLifeLost: 0,
        },
        inventory: [],
        position: { x: 0, y: 0 },
        turn: 0,
        visitedTiles: [],
    };
    socketSubscription: Subscription = new Subscription();

    private isCombatModalOpen = new BehaviorSubject<boolean>(false);
    public isCombatModalOpen$ = this.isCombatModalOpen.asObservable();

    private opponent = new BehaviorSubject<Player>(this.defaultPlayer);
    public opponent$ = this.opponent.asObservable();

    private combatRoomId = new BehaviorSubject<string>('');
    public combatRoomId$ = this.combatRoomId.asObservable();

    constructor(
        private socketService: SocketService,
        private gameService: GameService,
        private playerService: PlayerService,
    ) {
        this.socketService = socketService;
        this.gameService = gameService;
        this.playerService = playerService;
    }

    combatListenerPage() {
        this.socketSubscription.add(
            this.socketService
                .listen<{ message: string; combatRoomId: string; challenger: Player; opponent: Player }>('combatStarted')
                .subscribe((data) => {
                    console.log(`${data.message} in room ${data.combatRoomId}`);
                    if (this.playerService.player.socketId === data.challenger.socketId) {
                        this.opponent.next(data.opponent);
                    } else {
                        this.opponent.next(data.challenger);
                    }
                    this.combatRoomId.next(data.combatRoomId);
                    this.isCombatModalOpen.next(true);
                }),
        );
        //TODO
        this.socketSubscription.add(
            this.socketService.listen<{ player1: Player; player2: Player; message: string }>('combatFinishedByEvasion').subscribe((data) => {
                console.log(data.message);

                if (data.player1 && data.player2) {
                    this.gameService.game.players = this.gameService.game.players.map((player) => {
                        if (player.socketId === data.player1.socketId || player.socketId === data.player2.socketId) {
                            player.specs.nCombats += 1;
                        }
                        return player;
                    });
                    console.log('Players updated after combat:', this.gameService.game.players);
                } else {
                    console.log('No players found');
                }
                setTimeout(() => {
                    this.isCombatModalOpen.next(false);
                }, 3000);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<{ message: string; combatWinner: Player; combatLooser: Player }>('combatFinishedNormally').subscribe((data) => {
                console.log(data.message);

                this.gameService.game.players = this.gameService.game.players.map((player) => {
                    if (player.socketId === data.combatLooser.socketId) {
                        return { ...player, ...data.combatLooser };
                    } else if (player.socketId === data.combatWinner.socketId) {
                        return { ...player, ...data.combatWinner };
                    }
                    return player;
                });

                console.log('Players updated after combat:', this.gameService.game.players);
                setTimeout(() => {
                    this.isCombatModalOpen.next(false);
                }, 3000);
            }),
        );
    }
}
