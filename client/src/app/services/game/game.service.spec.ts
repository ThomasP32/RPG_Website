import { TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { ProfileType } from '@common/constants';
import { GameCreationEvents } from '@common/events/game-creation.events';
import { Game, GameCtf, Player, Specs } from '@common/game';
import { Map, Mode } from '@common/map.types';
import { of, Subject } from 'rxjs';
import { GameService } from './game.service';

describe('GameService', () => {
    let service: GameService;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;

    let currentGameSubject: Subject<Game>;
    let currentPlayersSubject: Subject<Player[]>;

    const mockPlayer: Player = {
        socketId: 'socket-1',
        name: 'Test Player',
        avatar: 1,
        isActive: true,
        position: { x: 0, y: 0 },
        specs: { life: 100, speed: 10, attack: 10, defense: 10, movePoints: 5, actions: 2 } as Specs,
        inventory: [],
        turn: 0,
        visitedTiles: [],
        initialPosition: { x: 0, y: 0 },
        profile: ProfileType.NORMAL,
    };

    const mockGame: Game = {
        id: 'game-id',
        players: [mockPlayer],
        hostSocketId: 'socket-1',
        hasStarted: true,
        currentTurn: 0,
    } as Game;

    beforeEach(() => {
        const socketServiceMock = jasmine.createSpyObj('SocketService', ['listen', 'sendMessage']);
        const playerServiceMock = jasmine.createSpyObj('PlayerService', ['setPlayer'], { player: mockPlayer });

        currentGameSubject = new Subject<Game>();
        currentPlayersSubject = new Subject<Player[]>();

        socketServiceMock.listen.and.callFake((eventName: string) => {
            switch (eventName) {
                case GameCreationEvents.CurrentGame:
                    return currentGameSubject.asObservable();
                case GameCreationEvents.CurrentPlayers:
                    return currentPlayersSubject.asObservable();
                default:
                    return of({});
            }
        });

        TestBed.configureTestingModule({
            providers: [
                GameService,
                { provide: SocketService, useValue: socketServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
            ],
        });

        service = TestBed.inject(GameService);
        socketServiceSpy = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
        playerServiceSpy = TestBed.inject(PlayerService) as jasmine.SpyObj<PlayerService>;

        service.setGame(mockGame);
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    describe('#setGame', () => {
        it('should set the game property', () => {
            const newGame: Game = { ...mockGame, id: 'new-game-id' };
            service.setGame(newGame);
            expect(service.game).toEqual(newGame);
        });
    });

    describe('#listenToGameData', () => {
        it('should update game data and send startGame if player is host', () => {
            service.listenToGameData();
            currentGameSubject.next(mockGame);

            expect(service.game).toEqual(mockGame);
            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('startGame', mockGame.id);
        });
    });

    describe('#listenPlayerData', () => {
        it('should update game players and set the player in PlayerService if players are available', () => {
            const players = [mockPlayer];
            service.listenPlayerData();
            currentPlayersSubject.next(players);

            expect(service.game.players).toEqual(players);
            expect(playerServiceSpy.setPlayer).toHaveBeenCalledWith(mockPlayer);
        });

        it('should log an error if no players are received', () => {
            spyOn(console, 'error');
            service.listenPlayerData();
            currentPlayersSubject.next([]);

            expect(console.error).toHaveBeenCalledWith('Failed to load players or no players available');
        });
    });

    describe('#createNewGame', () => {
        it('should create a new game with the given map and gameId', () => {
            const mockMap = {
                mapSize: { x: 10, y: 10 },
                tiles: [],
                items: [],
                startTiles: [],
                doorTiles: [],
            } as unknown as Map;

            const gameId = 'game-id-123';
            const expectedGame: Game = {
                ...mockMap,
                id: gameId,
                players: [mockPlayer],
                hostSocketId: '',
                currentTurn: 0,
                nDoorsManipulated: [],
                duration: 0,
                nTurns: 0,
                debug: false,
                isLocked: false,
                hasStarted: false,
            };

            const result = service.createNewGame(mockMap, gameId);
            expect(result).toEqual(expectedGame);
        });
    });

    describe('#createNewCtfGame', () => {
        it('should create a new CTF game with the given map and gameId', () => {
            const mockMap = {
                mapSize: { x: 10, y: 10 },
                tiles: [],
                items: [],
                startTiles: [],
                doorTiles: [],
            } as unknown as Map;

            const gameId = 'ctf-game-id-123';
            const expectedGame: GameCtf = {
                ...mockMap,
                id: gameId,
                players: [mockPlayer],
                hostSocketId: '',
                currentTurn: 0,
                nDoorsManipulated: [],
                duration: 0,
                nTurns: 0,
                debug: false,
                isLocked: false,
                hasStarted: false,
                nPlayersCtf: [],
                mode: Mode.Ctf,
            };

            const result = service.createNewCtfGame(mockMap, gameId);
            expect(result).toEqual(expectedGame);
        });
    });
});
