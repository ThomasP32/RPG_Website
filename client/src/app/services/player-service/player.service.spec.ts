import { TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { ProfileType } from '@common/constants';
import { Avatar, Bonus, Player } from '@common/game';
import { PlayerService } from './player.service';

describe('PlayerService', () => {
    let service: PlayerService;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('SocketService', ['socket']);
        TestBed.configureTestingModule({
            providers: [PlayerService, { provide: SocketService, useValue: spy }],
        });
        service = TestBed.inject(PlayerService);
        socketServiceSpy = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('resetPlayer', () => {
        it('should reset the player to default values', () => {
            service.resetPlayer();
            const player = service.player;

            expect(player.name).toBe('');
            expect(player.socketId).toBe('');
            expect(player.isActive).toBe(true);
            expect(player.avatar).toBe(Avatar.Avatar1);
            expect(player.specs.life).toBe(4);
            expect(player.specs.speed).toBe(4);
            expect(player.specs.attack).toBe(4);
            expect(player.specs.defense).toBe(4);
            expect(player.specs.attackBonus).toBe(Bonus.D6);
            expect(player.specs.defenseBonus).toBe(Bonus.D4);
            expect(player.inventory.length).toBe(0);
            expect(player.position).toEqual({ x: 0, y: 0 });
            expect(player.turn).toBe(0);
            expect(player.visitedTiles.length).toBe(0);
        });
    });

    describe('createPlayer', () => {
        it('should create a player with updated specs and socket ID', () => {
            socketServiceSpy.socket = { id: '12345' } as any;
            service.setPlayerName('Test Player');
            service.setPlayerAvatar(Avatar.Avatar2);
            service.assignBonus('life');
            service.assignDice('attack');

            service.createPlayer();
            const player = service.player;

            expect(player.name).toBe('Test Player');
            expect(player.socketId).toBe('12345');
            expect(player.avatar).toBe(Avatar.Avatar2);
            expect(player.specs.life).toBe(6);
            expect(player.specs.speed).toBe(4);
            expect(player.specs.attackBonus).toBe(Bonus.D6);
            expect(player.specs.defenseBonus).toBe(Bonus.D4);
        });

        it('should create a player with updated specs and empty strings as socket ID when none', () => {
            socketServiceSpy.socket = {} as any;
            service.setPlayerName('Test Player');
            service.setPlayerAvatar(Avatar.Avatar2);
            service.assignBonus('life');
            service.assignDice('attack');

            service.createPlayer();
            const player = service.player;

            expect(player.name).toBe('Test Player');
            expect(player.socketId).toBe('');
            expect(player.avatar).toBe(Avatar.Avatar2);
            expect(player.specs.life).toBe(6);
            expect(player.specs.speed).toBe(4);
            expect(player.specs.attackBonus).toBe(Bonus.D6);
            expect(player.specs.defenseBonus).toBe(Bonus.D4);
        });
    });

    describe('#setPlayer', () => {
        it('should set a player', () => {
            const mockPlayer: Player = {
                name: 'New Player',
                socketId: '67890',
                isActive: true,
                avatar: Avatar.Avatar2,
                specs: {
                    life: 5,
                    speed: 5,
                    attack: 5,
                    defense: 5,
                    attackBonus: Bonus.D6,
                    defenseBonus: Bonus.D4,
                    evasions: 2,
                    movePoints: 0,
                    actions: 0,
                    nVictories: 0,
                    nDefeats: 0,
                    nCombats: 0,
                    nEvasions: 0,
                    nLifeTaken: 0,
                    nLifeLost: 0,
                    nItemsUsed: 0,
                },
                inventory: [],
                position: { x: 0, y: 0 },
                turn: 0,
                visitedTiles: [],
                initialPosition: { x: 0, y: 0 },
                profile: ProfileType.NORMAL,
            };
            service.setPlayer(mockPlayer);
            expect(service.player).toEqual(mockPlayer);
        });
    });

    describe('#setPlayerName', () => {
        it('should set the player name without leading or trailing spaces', () => {
            service.setPlayerName('  Player Name   ');
            expect(service.player.name).toBe('Player Name');
        });
    });

    describe('#setPlayerAvatar', () => {
        it('should set the player avatar', () => {
            service.setPlayerAvatar(Avatar.Avatar3);
            expect(service.player.avatar).toBe(Avatar.Avatar3);
        });
    });

    describe('#assignBonus', () => {
        it('should add 2 to life and reset speed when "life" bonus is assigned', () => {
            service.resetPlayer();
            service.assignBonus('life');
            const player = service.player;

            expect(player.specs.life).toBe(6);
            expect(player.specs.speed).toBe(4);
        });

        it('should add 2 to speed and reset life when "speed" bonus is assigned', () => {
            service.resetPlayer();
            service.assignBonus('speed');
            const player = service.player;

            expect(player.specs.speed).toBe(6);
            expect(player.specs.life).toBe(4);
        });
    });

    describe('#assignDice', () => {
        it('should set attack bonus to D6 and defense bonus to D4 when "attack" dice is assigned', () => {
            service.resetPlayer();
            service.assignDice('attack');
            const player = service.player;

            expect(player.specs.attackBonus).toBe(Bonus.D6);
            expect(player.specs.defenseBonus).toBe(Bonus.D4);
        });

        it('should set attack bonus to D4 and defense bonus to D6 when "defense" dice is assigned', () => {
            service.resetPlayer();
            service.assignDice('defense');
            const player = service.player;

            expect(player.specs.attackBonus).toBe(Bonus.D4);
            expect(player.specs.defenseBonus).toBe(Bonus.D6);
        });
    });

    describe('integration tests', () => {
        it('should create player with bonuses and dice assigned', () => {
            socketServiceSpy.socket = { id: '12345' } as any;
            service.setPlayerName('Final Player');
            service.setPlayerAvatar(Avatar.Avatar4);
            service.assignBonus('speed');
            service.assignDice('defense');

            service.createPlayer();
            const player = service.player;

            expect(player.name).toBe('Final Player');
            expect(player.socketId).toBe('12345');
            expect(player.avatar).toBe(Avatar.Avatar4);
            expect(player.specs.life).toBe(4);
            expect(player.specs.speed).toBe(6);
            expect(player.specs.attackBonus).toBe(Bonus.D4);
            expect(player.specs.defenseBonus).toBe(Bonus.D6);
        });
    });
});
