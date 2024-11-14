import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { BONUS, DEFAULT_ACTIONS, DEFAULT_ATTACK, DEFAULT_DEFENSE, DEFAULT_EVASIONS, DEFAULT_HP, DEFAULT_SPEED } from '@common/constants';
import { Avatar, Bonus, Player, Specs } from '@common/game';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    player: Player;

    constructor(private socketService: SocketService) {
        this.resetPlayer();
        this.socketService = socketService;
    }

    createPlayer() {
        const playerSpecs: Specs = {
            life: this.player.specs.life,
            speed: this.player.specs.speed,
            attack: this.player.specs.attack,
            defense: this.player.specs.defense,
            attackBonus: this.player.specs.attackBonus,
            defenseBonus: this.player.specs.defenseBonus,
            movePoints: this.player.specs.speed,
            evasions: DEFAULT_EVASIONS,
            actions: DEFAULT_ACTIONS,
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
            nEvasions: 0,
            nLifeTaken: 0,
            nLifeLost: 0,
        };
        const player: Player = {
            name: this.player.name,
            socketId: this.socketService.socket.id || '',
            isActive: true,
            avatar: this.player.avatar,
            specs: playerSpecs,
            inventory: [],
            position: { x: 0, y: 0 },
            initialPosition: { x: 0, y: 0 },
            turn: 0,
            visitedTiles: [],
        };
        this.player = player;
    }

    getPlayer(): Player {
        return this.player;
    }

    setPlayer(player: Player): void {
        this.player = player;
    }

    setPlayerName(name: string): void {
        this.player.name = name.trim();
    }

    setPlayerAvatar(avatar: Avatar): void {
        this.player.avatar = avatar;
    }

    assignBonus(type: 'life' | 'speed'): void {
        if (type === 'life') {
            this.player.specs.life += BONUS;
            this.player.specs.speed = DEFAULT_SPEED;
        } else if (type === 'speed') {
            this.player.specs.speed += BONUS;
            this.player.specs.life = DEFAULT_HP;
        }
    }

    assignDice(type: 'attack' | 'defense'): void {
        if (type === 'attack') {
            this.player.specs.attackBonus = Bonus.D6;
            this.player.specs.defenseBonus = Bonus.D4;
        } else if (type === 'defense') {
            this.player.specs.attackBonus = Bonus.D4;
            this.player.specs.defenseBonus = Bonus.D6;
        }
    }

    resetPlayer(): void {
        const playerSpecs: Specs = {
            life: DEFAULT_HP,
            speed: DEFAULT_SPEED,
            attack: DEFAULT_ATTACK,
            defense: DEFAULT_DEFENSE,
            attackBonus: Bonus.D6,
            defenseBonus: Bonus.D4,
            evasions: DEFAULT_EVASIONS,
            movePoints: 0,
            actions: DEFAULT_ACTIONS,
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
            nEvasions: 0,
            nLifeTaken: 0,
            nLifeLost: 0,
        };
        const player: Player = {
            name: '',
            socketId: '',
            isActive: true,
            avatar: Avatar.Avatar1,
            specs: playerSpecs,
            inventory: [],
            position: { x: 0, y: 0 },
            initialPosition: { x: 0, y: 0 },
            turn: 0,
            visitedTiles: [],
        };
        this.player = player;
    }
}
