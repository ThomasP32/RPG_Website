import { TestBed } from '@angular/core/testing';
import { CombatService } from '@app/services/combat/combat.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Avatar, Bonus, Game, Player, Specs } from '@common/game';
import { Mode } from '@common/map.types';
import { Observable, of, Subject } from 'rxjs';
import { GameService } from '../game/game.service';
import { PlayerService } from '../player-service/player.service';

describe('CombatService', () => {
    let service: CombatService;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    let isCombatModalOpen = new Subject<boolean>();
    let opponent = new Subject<Player>();
    let combatRoomId = new Subject<string>();

    const mockSpecs: Specs = {
        life: 100,
        speed: 10,
        attack: 15,
        defense: 10,
        movePoints: 5,
        attackBonus: Bonus.D4,
        defenseBonus: Bonus.D6,
        actions: 2,
        nVictories: 0,
        nDefeats: 0,
        nCombats: 0,
        nEvasions: 0,
        nLifeTaken: 0,
        nLifeLost: 0,
    };

    const mockPlayer: Player = {
        socketId: 'socket-1',
        name: 'Test Player',
        avatar: Avatar.Avatar1,
        isActive: true,
        position: { x: 0, y: 0 },
        specs: mockSpecs,
        inventory: [],
        turn: 0,
        visitedTiles: [],
    };
    const mockPlayer2: Player = {
        socketId: 'socket-2',
        name: 'Test Player2',
        avatar: Avatar.Avatar1,
        isActive: true,
        position: { x: 0, y: 0 },
        specs: mockSpecs,
        inventory: [],
        turn: 0,
        visitedTiles: [],
    };
    const mockGame: Game = {
        id: 'test-game-id',
        hostSocketId: 'test-socket',
        hasStarted: true,
        currentTurn: 0,
        mapSize: { x: 5, y: 5 },
        tiles: [],
        doorTiles: [],
        startTiles: [],
        items: [],
        players: [mockPlayer, mockPlayer2],
        mode: Mode.Classic,
        nTurns: 0,
        debug: false,
        nDoorsManipulated: 0,
        duration: 0,
        isLocked: true,
        name: 'game',
        description: 'game description',
        imagePreview: 'image-preview',
    };

    beforeEach(() => {
        playerServiceSpy = jasmine.createSpyObj('PlayerService', ['setPlayerAvatar', 'setPlayerName', 'setPlayer'], { player: mockPlayer });
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['setGame']);
        gameServiceSpy.setGame(mockGame);
        console.log(gameServiceSpy.game);

        isCombatModalOpen = new Subject<boolean>();
        opponent = new Subject<Player>();
        combatRoomId = new Subject<string>();

        socketServiceSpy.listen.and.callFake(<T>(eventname: string): Observable<T> => {
            switch (eventname) {
                case 'isCombatModalOpen':
                    return isCombatModalOpen.asObservable() as Observable<T>;
                case 'opponent':
                    return opponent.asObservable() as Observable<T>;
                case 'combatRoomId':
                    return combatRoomId.asObservable() as Observable<T>;
                default:
                    return of({}) as Observable<T>;
            }
        });
        TestBed.configureTestingModule({
            providers: [
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: PlayerService, useValue: playerServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
            ],
        });
        service = TestBed.inject(CombatService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // it('should handle the "combatStarted" event', fakeAsync(() => {
    //     const mockData = {
    //         message: 'Combat initiated!',
    //         combatRoomId: 'combat-room-123',
    //         challenger: mockPlayer,
    //         opponent: { ...mockPlayer, name: 'Opponent Player' },
    //     };

    //     socketServiceSpy.listen.and.returnValue(of(mockData));

    //     service.combatListenerPage();

    //     tick();

    //     opponent.subscribe((opponent) => {
    //         expect(opponent).toEqual(mockData.opponent);
    //     });

    //     combatRoomId.subscribe((roomId) => {
    //         expect(roomId).toEqual(mockData.combatRoomId);
    //     });

    //     tick();

    //     expect(socketServiceSpy.listen).toHaveBeenCalledWith('combatStarted');
    // }));
});
