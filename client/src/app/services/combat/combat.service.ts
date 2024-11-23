import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { TIME_LIMIT_DELAY } from '@common/constants';
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
            evasions: 2,
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
        initialPosition: { x: 0, y: 0 },
        turn: 0,
        visitedTiles: [],
        profile: null,
    };

    socketSubscription: Subscription = new Subscription();

    private isCombatModalOpen = new BehaviorSubject<boolean>(false);
    public isCombatModalOpen$ = this.isCombatModalOpen.asObservable();

    private opponent = new BehaviorSubject<Player>(this.defaultPlayer);
    public opponent$ = this.opponent.asObservable();

    constructor(
        private socketService: SocketService,
        private playerService: PlayerService,
    ) {
        this.socketService = socketService;
        this.playerService = playerService;
    }

    listenCombatStart() {
        this.socketSubscription.add(
            this.socketService.listen<{ challenger: Player; opponent: Player }>('combatStarted').subscribe((data) => {
                if (this.playerService.player.socketId === data.challenger.socketId) {
                    this.opponent.next(data.opponent);
                } else {
                    this.opponent.next(data.challenger);
                }
                this.isCombatModalOpen.next(true);
            }),
        );
    }

    listenForCombatFinish(): void {
        this.socketSubscription.add(
            this.socketService.listen<Player>('combatFinishedNormally').subscribe(() => {
                setTimeout(() => {
                    this.isCombatModalOpen.next(false);
                }, TIME_LIMIT_DELAY);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<Player>('combatFinishedByDisconnection').subscribe(() => {
                setTimeout(() => {
                    this.isCombatModalOpen.next(false);
                }, TIME_LIMIT_DELAY);
            }),
        );
    }

    listenForEvasionInfo(): void {
        this.socketSubscription.add(
            this.socketService.listen<Player>('evasionSuccess').subscribe(() => {
                setTimeout(() => {
                    this.isCombatModalOpen.next(false);
                }, TIME_LIMIT_DELAY);
            }),
        );
        this.socketSubscription.add(
            this.socketService.listen<Player>('evasionFailed').subscribe((evadingPlayer) => {
                if (evadingPlayer.socketId === this.playerService.player.socketId) {
                    this.playerService.setPlayer(evadingPlayer);
                } else {
                    this.opponent.next(evadingPlayer);
                }
            }),
        );
    }
}
