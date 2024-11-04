import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Avatar, Bonus, Game, Player, Specs } from '@common/game';
import { Coordinate } from '@common/map.types';
import { Observable, of, Subject } from 'rxjs';

describe('GameTurnService', () => {
    let service: GameTurnService;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    let yourTurnSubject: Subject<Player>;
    let playerTurnSubject: Subject<string>;
    let playerPossibleMovesSubject: Subject<[string, { path: Coordinate[]; weight: number }][]>;
    let positionToUpdateSubject: Subject<{ game: Game; player: Player }>;
    let youFinishedMovingSubject: Subject<null>;
    let youFellSubject: Subject<Player>;
    let yourCombatsSubject: Subject<Player[]>;

    const mockSpecs: Specs = {
        life: 100,
        speed: 10,
        attack: 15,
        defense: 10,
        movePoints: 5,
        attackBonus: Bonus.D4,
        defenseBonus: Bonus.D6,
        actions: 2,
        evasions: 2,
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
        initialPosition: { x: 0, y: 0},
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

    beforeEach(() => {
        playerServiceSpy = jasmine.createSpyObj('PlayerService', ['setPlayerAvatar', 'setPlayerName', 'setPlayer'], { player: mockPlayer });
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['setGame'], { game: mockGame });

        yourTurnSubject = new Subject<Player>();
        playerTurnSubject = new Subject<string>();
        playerPossibleMovesSubject = new Subject<[string, { path: Coordinate[]; weight: number }][]>();
        positionToUpdateSubject = new Subject<{ game: Game; player: Player }>();
        youFinishedMovingSubject = new Subject<null>();
        youFellSubject = new Subject<Player>();
        yourCombatsSubject = new Subject<Player[]>();

        socketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
            switch (eventName) {
                case 'yourTurn':
                    return yourTurnSubject.asObservable() as Observable<T>;
                case 'playerTurn':
                    return playerTurnSubject.asObservable() as Observable<T>;
                case 'playerPossibleMoves':
                    return playerPossibleMovesSubject.asObservable() as Observable<T>;
                case 'positionToUpdate':
                    return positionToUpdateSubject.asObservable() as Observable<T>;
                case 'youFinishedMoving':
                    return youFinishedMovingSubject.asObservable() as Observable<T>;
                case 'youFell':
                    return youFellSubject.asObservable() as Observable<T>;
                case 'yourCombats':
                    return yourCombatsSubject.asObservable() as Observable<T>;
                default:
                    return of({}) as Observable<T>;
            }
        });

        TestBed.configureTestingModule({
            providers: [
                GameTurnService,
                { provide: PlayerService, useValue: playerServiceSpy },
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
            ],
        });
        service = TestBed.inject(GameTurnService);
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    describe('#listenForTurn', () => {
        it('should update playerTurn and clear moves when "playerTurn" event is received', () => {
            spyOn(service, 'clearMoves');
            service.listenForTurn();

            playerTurnSubject.next('Another Player');

            expect(service.clearMoves).toHaveBeenCalled();
            expect(service['playerTurn'].getValue()).toBe('Another Player');
        });
    });

    describe('#movePlayer', () => {
        it('should send moveToPosition message with correct parameters', () => {
            const position: Coordinate = { x: 5, y: 5 };
            service.movePlayer(position);

            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('moveToPosition', {
                playerTurn: mockPlayer.turn,
                gameId: mockGame.id,
                destination: position,
            });
        });
    });

    describe('#clearMoves', () => {
        it('should clear the moves map', () => {
            service.moves.set('test', { path: [], weight: 0 });
            service.clearMoves();
            expect(service.moves.size).toBe(0);
        });
    });

    describe('#listenForPlayerMove', () => {
        it('should update game and player state when position is updated', () => {
            service.listenForPlayerMove();
            const mockData = { game: mockGame, player: mockPlayer };
            positionToUpdateSubject.next(mockData);

            expect(playerServiceSpy.setPlayer).toHaveBeenCalledWith(mockData.player);
            expect(gameServiceSpy.setGame).toHaveBeenCalledWith(mockData.game);
        });

        it('should clear moves and resume turn when youFinishedMoving event is received', () => {
            spyOn(service, 'clearMoves');
            spyOn(service, 'resumeTurn');
            service.listenForPlayerMove();
            youFinishedMovingSubject.next(null);

            expect(service.clearMoves).toHaveBeenCalled();
            expect(service.resumeTurn).toHaveBeenCalled();
        });
    });

    describe('#startTurn', () => {
        it('should call getMoves and getCombats', () => {
            spyOn(service, 'getMoves');
            spyOn(service, 'getCombats');

            service.startTurn();

            expect(service.getMoves).toHaveBeenCalled();
            expect(service.getCombats).toHaveBeenCalled();
        });
    });

    describe('#resumeTurn', () => {
        beforeEach(() => {
            service['playerTurn'].next(mockPlayer.name);
        });

        it("should call getCombats if it is the player's turn and has not already fought", () => {
            spyOn(service, 'getCombats');
            service['alreadyFought'] = false;

            service.resumeTurn();

            expect(service.getCombats).toHaveBeenCalled();
        });

        it("should only call getCombats if it is the player's turn and has already fought", () => {
            spyOn(service, 'getCombats');
            service['alreadyFought'] = true;
            service['playerTurn'].next(mockPlayer.name);

            service.resumeTurn();

            expect(service.getCombats).not.toHaveBeenCalled();
        });
    });

    describe('#endTurn', () => {
        it('should clear moves and send endTurn message if player has not fallen', () => {
            spyOn(service, 'clearMoves');
            service['youFell'].next(false);

            service.endTurn();

            expect(service.clearMoves).toHaveBeenCalled();
            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('endTurn', mockGame.id);
        });

        it('should not send endTurn message if player has fallen', () => {
            service['youFell'].next(true);

            service.endTurn();

            expect(socketServiceSpy.sendMessage).not.toHaveBeenCalled();
        });
    });

    describe('#endTurnBecauseFell', () => {
        it('should set youFell to true, clear moves, and call endTurn after 3 seconds', fakeAsync(() => {
            spyOn(service, 'clearMoves');
            spyOn(service, 'endTurn');

            service.endTurnBecauseFell();

            expect(service['youFell'].getValue()).toBe(true);

            tick(3000);

            expect(service['youFell'].getValue()).toBe(false);
            expect(service.clearMoves).toHaveBeenCalled();
            expect(service.endTurn).toHaveBeenCalled();
        }));
    });

    describe('#listenForTurn', () => {
        beforeEach(() => {
            spyOn(service, 'clearMoves');
            spyOn(service, 'getCombats');
            spyOn(service, 'verifyPlayerWin')
            service.listenForTurn();
        });

        it('should handle startTurn event for the current player by calling getCombats', () => {
            service['playerTurn'].next(mockPlayer.name);
            service.listenForTurn();
            playerTurnSubject.next(mockPlayer.name);

            expect(service.getCombats).toHaveBeenCalled();
        });

        it('should handle "yourTurn" event and update relevant properties', () => {
            const newPlayer: Player = { ...mockPlayer, name: 'New Player' };
    
            yourTurnSubject.next(newPlayer);
    
            expect(service.clearMoves).toHaveBeenCalled();
            expect(service.verifyPlayerWin).toHaveBeenCalled();
            expect(service['alreadyFought']).toBe(false);
            expect(service['noCombats']).toBe(false);
            expect(service['playerTurn'].getValue()).toBe(newPlayer.name);
        });
    });

    describe('#getMoves', () => {
        it('should send getMovements message', () => {
            service.getMoves();

            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('getMovements', mockGame.id);
        });
    });

    describe('#getCombats', () => {
        it('should listen for possible combats and send getCombats message', () => {
            spyOn(service, 'listenForPossibleCombats');
            service.getCombats();

            expect(service.listenForPossibleCombats).toHaveBeenCalled();
            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('getCombats', mockGame.id);
        });
    });

    describe('#listenMoves', () => {
        beforeEach(() => {
            spyOn(service, 'endTurn');
            service.listenMoves();
        });

        it('should update moves with received paths and call endTurn if only one move and already fought or no combats', () => {
            service['alreadyFought'] = true;
            service['noCombats'] = false;

            const mockPaths: [string, { path: Coordinate[]; weight: number }][] = [['player1', { path: [{ x: 0, y: 0 }], weight: 1 }]];
            playerPossibleMovesSubject.next(mockPaths);

            expect(service.moves.size).toBe(1);
            expect(service.moves.get('player1')?.path).toEqual([{ x: 0, y: 0 }]);

            expect(service.endTurn).toHaveBeenCalled();
        });

        it('should not call endTurn if multiple moves are available', () => {
            const mockPaths: [string, { path: Coordinate[]; weight: number }][] = [
                ['player1', { path: [{ x: 0, y: 0 }], weight: 1 }],
                ['player2', { path: [{ x: 1, y: 1 }], weight: 2 }],
            ];
            playerPossibleMovesSubject.next(mockPaths);

            expect(service.moves.size).toBe(2);
            expect(service.moves.get('player1')?.path).toEqual([{ x: 0, y: 0 }]);
            expect(service.moves.get('player2')?.path).toEqual([{ x: 1, y: 1 }]);

            expect(service.endTurn).not.toHaveBeenCalled();
        });

        it('should not call endTurn if there is only one move but conditions are not met', () => {
            service['alreadyFought'] = false;
            service['noCombats'] = false;

            const mockPaths: [string, { path: Coordinate[]; weight: number }][] = [['player1', { path: [{ x: 0, y: 0 }], weight: 1 }]];
            playerPossibleMovesSubject.next(mockPaths);

            expect(service.moves.size).toBe(1);
            expect(service.moves.get('player1')?.path).toEqual([{ x: 0, y: 0 }]);

            expect(service.endTurn).not.toHaveBeenCalled();
        });
    });

    describe('#listenForPossibleCombats', () => {
        beforeEach(() => {
            service.listenForPossibleCombats();
        });

        it('should set noCombats to true and update possibleOpponents when no opponents are available', () => {
            const emptyOpponents: Player[] = [];

            yourCombatsSubject.next(emptyOpponents);

            expect(service['noCombats']).toBe(true);

            service.possibleOpponents$.subscribe((opponents) => {
                expect(opponents).toEqual([]);
            });
        });

        it('should set noCombats to false and update possibleOpponents when opponents are available', () => {
            const mockOpponents: Player[] = [mockPlayer];

            yourCombatsSubject.next(mockOpponents);

            expect(service['noCombats']).toBe(false);

            service.possibleOpponents$.subscribe((opponents) => {
                expect(opponents).toEqual(mockOpponents);
            });
        });
    });
});
