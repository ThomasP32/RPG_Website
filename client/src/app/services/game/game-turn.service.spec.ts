import { TestBed } from '@angular/core/testing';
import { GameTurnService } from './game-turn.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { SocketService } from '../communication-socket/communication-socket.service';
import { of, Subject, Observable } from 'rxjs';
import { Player, Specs, Game, Avatar, Bonus } from '@common/game';
import { Coordinate } from '@common/map.types';

describe('GameTurnService', () => {
    let service: GameTurnService;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let yourTurnSubject: Subject<void>;
    let playerTurnSubject: Subject<string>;
    let playerPossibleMovesSubject: Subject<Coordinate[]>;
    let playerFinishedTurnSubject: Subject<Game>;

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

    const mockGame: Game = {
        id: 'game-1',
        players: [mockPlayer],
        hasStarted: true,
        currentTurn: 0,
    } as Game;

    beforeEach(async () => {
        playerServiceSpy = jasmine.createSpyObj('PlayerService', ['getPlayer']);
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen']);

        yourTurnSubject = new Subject<void>();
        playerTurnSubject = new Subject<string>();
        playerPossibleMovesSubject = new Subject<Coordinate[]>();
        playerFinishedTurnSubject = new Subject<Game>();

        // Mocking `listen` with explicit return type casting to `Observable<unknown>`
        socketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
            switch (eventName) {
                case 'yourTurn': return yourTurnSubject.asObservable() as Observable<T>;
                case 'playerTurn': return playerTurnSubject.asObservable() as Observable<T>;
                case 'playerPossibleMoves': return playerPossibleMovesSubject.asObservable() as Observable<T>;
                case 'playerFinishedTurn': return playerFinishedTurnSubject.asObservable() as Observable<T>;
                default: return of(null) as Observable<T>;
            }
        });

        playerServiceSpy.getPlayer.and.returnValue(mockPlayer);

        await TestBed.configureTestingModule({
            providers: [
                GameTurnService,
                { provide: PlayerService, useValue: playerServiceSpy },
                { provide: SocketService, useValue: socketServiceSpy },
            ],
        }).compileComponents();

        service = TestBed.inject(GameTurnService);
        service.game = mockGame;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('startTurn', () => {
        it('should call getMoves when startTurn is called', () => {
            spyOn(service, 'getMoves');
            service.startTurn();
            expect(service.getMoves).toHaveBeenCalled();
        });
    });

    describe('endTurn', () => {
        it('should send endTurn message with game ID', () => {
            service.endTurn();
            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('endTurn', mockGame.id);
        });
    });

    describe('listenForTurn', () => {
        it('should update playerTurn with player name on yourTurn event', () => {
            service.listenForTurn();
            yourTurnSubject.next(); // Emit `yourTurn` event
            expect(service['playerTurn'].getValue()).toBe(mockPlayer.name);
        });

        it('should update playerTurn with provided player name on playerTurn event', () => {
            const otherPlayerName = 'Another Player';
            service.listenForTurn();
            playerTurnSubject.next(otherPlayerName); // Emit `playerTurn` event with another player name
            expect(service['playerTurn'].getValue()).toBe(otherPlayerName);
        });
    });

    describe('getMoves', () => {
        it('should call listenMoves and send getMovements message', () => {
            spyOn(service, 'listenMoves');
            service.getMoves();
            expect(service.listenMoves).toHaveBeenCalled();
            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('getMovements', { playerName: mockPlayer.name, gameId: mockGame.id });
        });
    });

    describe('listenMoves', () => {
        it('should update moves when playerPossibleMoves event is received', () => {
            const expectedMoves = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
            service.listenMoves();
            playerPossibleMovesSubject.next(expectedMoves); 
            expect(service.moves).toEqual(expectedMoves);
        });
    });

    describe('listenForTurnRotation', () => {
        it('should log "bonjour" when playerFinishedTurn event is triggered', () => {
            service.listenForTurnRotation();
            playerFinishedTurnSubject.next(mockGame); 

            expect(socketServiceSpy.listen).toHaveBeenCalledWith('playerFinishedTurn');
        });
    });
});
