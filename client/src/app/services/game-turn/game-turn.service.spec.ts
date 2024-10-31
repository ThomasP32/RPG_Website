import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Avatar, Bonus, Game, Player, Specs } from '@common/game';
import { Coordinate } from '@common/map.types';
import { Observable, of, Subject } from 'rxjs';
import { GameTurnService } from './game-turn.service';

describe('GameTurnService', () => {
    let service: GameTurnService;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;

    let yourTurnSubject: Subject<Player>;
    let playerTurnSubject: Subject<string>;
    let playerPossibleMovesSubject: Subject<[string, { path: Coordinate[]; weight: number }][]>;
    let positionToUpdateSubject: Subject<{ player: Player; path: Coordinate[] }>;
    let youFinishedMovingSubject: Subject<Player>;
    let youFellSubject: Subject<Player>;

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

    beforeEach(() => {
        playerServiceSpy = jasmine.createSpyObj('PlayerService', ['setPlayerAvatar', 'setPlayerName'], { player: mockPlayer });
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen']);

        yourTurnSubject = new Subject<Player>();
        playerTurnSubject = new Subject<string>();
        playerPossibleMovesSubject = new Subject<[string, { path: Coordinate[]; weight: number }][]>();
        positionToUpdateSubject = new Subject<{ player: Player; path: Coordinate[] }>();
        youFinishedMovingSubject = new Subject<Player>();
        youFellSubject = new Subject<Player>();

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
                default:
                    return of({}) as Observable<T>;
            }
        });

        TestBed.configureTestingModule({
            providers: [
                GameTurnService,
                { provide: PlayerService, useValue: playerServiceSpy },
                { provide: SocketService, useValue: socketServiceSpy },
            ],
        });

        service = TestBed.inject(GameTurnService);
        service.game = mockGame;
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    describe('#startTurn', () => {
        it("should call getMoves if it is the player's turn", fakeAsync(() => {
            spyOn(service, 'getMoves');
            service['playerTurn'].next(mockPlayer.name);
            service.startTurn();
            tick(3000);
            expect(service.getMoves).toHaveBeenCalled();
        }));
    });

    describe('#resumeTurn', () => {
        it("should call getMoves if it is the player's turn", () => {
            spyOn(service, 'getMoves');
            service['playerTurn'].next(mockPlayer.name);
            service.resumeTurn();
            expect(service.getMoves).toHaveBeenCalled();
        });
    });

    describe('#endTurn', () => {
        it('should clear moves and send endTurn message if youFell is false', () => {
            spyOn(service, 'clearMoves');
            service['youFell'].next(false);
            service.endTurn();
            expect(service.clearMoves).toHaveBeenCalled();
            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('endTurn', mockGame.id);
        });
    });

    describe('#endTurnBecauseFell', () => {
        it('should set youFell to true, clear moves, reset youFell, and end turn', fakeAsync(() => {
            spyOn(service, 'endTurn');
            service.endTurnBecauseFell();
            expect(service['youFell'].getValue()).toBeTrue();
            tick(3000);
            expect(service['youFell'].getValue()).toBeFalse();
            expect(service.endTurn).toHaveBeenCalled();
        }));
    });

    describe('#listenForTurn', () => {
        it('should set playerTurn and call startTurn on yourTurn event', () => {
            spyOn(service, 'startTurn');
            yourTurnSubject.next(mockPlayer);
            expect(service['playerTurn'].getValue()).toBe(mockPlayer.name);
            expect(service.startTurn).toHaveBeenCalled();
        });

        it('should update playerTurn and clear moves when "playerTurn" event is received', () => {
            spyOn(service, 'clearMoves');
            playerTurnSubject.next('Another Player');

            expect(service.clearMoves).toHaveBeenCalled();
            expect(service['playerTurn'].getValue()).toBe('Another Player');
        });
    });

    describe('#getMoves', () => {
        it('should call listenMoves and send getMovements message', () => {
            spyOn(service, 'listenMoves');
            service.getMoves();

            expect(service.listenMoves).toHaveBeenCalled();
            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('getMovements', mockGame.id);
        });
    });

    describe('#listenMoves', () => {
        it('should update moves map and call endTurn if only one move exists', () => {
            spyOn(service, 'endTurn');
            const paths: [string, { path: Coordinate[]; weight: number }][] = [
                [
                    '1,2',
                    {
                        path: [
                            { x: 1, y: 1 },
                            { x: 1, y: 2 },
                        ],
                        weight: 2,
                    },
                ],
            ];
            playerPossibleMovesSubject.next(paths);
            expect(service.moves.size).toBe(1);
            expect(service.moves.get('1,2')).toEqual({
                path: [
                    { x: 1, y: 1 },
                    { x: 1, y: 2 },
                ],
                weight: 2,
            });
            expect(service.endTurn).toHaveBeenCalled();
        });
    });

    describe('#movePlayer', () => {
        it('should send moveToPosition message', () => {
            const position = { x: 5, y: 5 };
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
        it('should update player position on positionToUpdate event', () => {
            const path = [
                { x: 2, y: 2 },
                { x: 3, y: 3 },
            ];
            const data = { player: mockPlayer, path };
            positionToUpdateSubject.next(data);
            const updatedPlayer = service.game.players.find((player) => player.name === mockPlayer.name);
            expect(updatedPlayer!.position).toEqual({ x: 3, y: 3 });
        });
        it('should update player, clear moves, and call resumeTurn on "youFinishedMoving" event', () => {
            spyOn(service, 'clearMoves');
            spyOn(service, 'resumeTurn');
            const updatedPlayer = { ...mockPlayer, position: { x: 2, y: 2 } };
            
            youFinishedMovingSubject.next(updatedPlayer);

            expect(service.clearMoves).toHaveBeenCalled();
            expect(service.resumeTurn).toHaveBeenCalled();
        });

        it('should update player, clear moves, and call endTurnBecauseFell on "youFell" event', fakeAsync(() => {
            spyOn(service, 'clearMoves');
            spyOn(service, 'endTurnBecauseFell');
            const updatedPlayer = { ...mockPlayer, position: { x: 2, y: 2 } };
            
            youFellSubject.next(updatedPlayer);

            expect(service.clearMoves).toHaveBeenCalled();
            expect(service.endTurnBecauseFell).toHaveBeenCalled();
        }));
    });
});
