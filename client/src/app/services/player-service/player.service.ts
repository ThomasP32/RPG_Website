import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Avatar, Bonus, Player, Specs } from '@common/game';

const defaultHp = 4;
const defaultSpeed = 4;
const defaultAttack = 4;
const defaultDefense = 4;

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    player: Player;

    constructor(private socketService: SocketService) {
        this.resetPlayer();
        this.socketService = socketService;
    }

    getPlayer(): Player {
        return this.player;
    }

    createPlayer() {
        const playerSpecs: Specs = {
            life: this.player.specs.life,
            speed: this.player.specs.speed,
            attack: this.player.specs.attack,
            defense: this.player.specs.defense,
            attackBonus: this.player.specs.attackBonus,
            defenseBonus: this.player.specs.defenseBonus,
            movePoints: 0,
            actions: 0,
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
            turn: 0,
            visitedTiles: [],
        };
        this.player = player;
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
            this.player.specs.life += 2;
            this.player.specs.speed = defaultSpeed;
        } else if (type === 'speed') {
            this.player.specs.speed += 2;
            this.player.specs.life = defaultHp;
        }
    }

    assignDice(type: 'attack' | 'defense'): void {
        if (type === 'attack') {
            this.player.specs.attackBonus.diceType = Bonus.D6;
            this.player.specs.defenseBonus.diceType = Bonus.D4;
        } else if (type === 'defense') {
            this.player.specs.attackBonus.diceType = Bonus.D4;
            this.player.specs.defenseBonus.diceType = Bonus.D6;
        }
    }

    resetPlayer(): void {
        const playerSpecs: Specs = {
            life: defaultHp,
            speed: defaultSpeed,
            attack: defaultAttack,
            defense: defaultDefense,
            attackBonus: { diceType: Bonus.D6, currentValue: 0 },
            defenseBonus: { diceType: Bonus.D4, currentValue: 0 },
            movePoints: 0,
            actions: 0,
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
            turn: 0,
            visitedTiles: [],
        };
        this.player = player;
    }
}
