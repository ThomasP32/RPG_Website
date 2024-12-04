import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { ProfileType } from '@common/constants';
import { CombatEvents } from '@common/events/combat.events';
import { Avatar, Bonus, Game, Player, Specs } from '@common/game';
import { Coordinate, DoorTile, ItemCategory, Tile } from '@common/map.types';
import { Observable, of, Subject } from 'rxjs';

describe('GameTurnService', () => {
    let service: GameTurnService;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    let yourTurnSubject: Subject<Player>;
    let playerTurnSubject: Subject<string>;
    let playerWonSubject: Subject<Player>;
    let playerPossibleMovesSubject: Subject<[string, { path: Coordinate[]; weight: number }][]>;
    let positionToUpdateSubject: Subject<{ game: Game; player: Player }>;
    let youFinishedMovingSubject: Subject<null>;
    let youFellSubject: Subject<Player>;
    let yourCombatsSubject: Subject<Player[]>;

    let combatFinishedByEvasionSubject: Subject<{ updatedGame: Game; evadingPlayer: Player }>;
    let combatFinishedSubject: Subject<{ updatedGame: Game; winner: Player }>;

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
        nItemsUsed: 0,
    };

    const mockPlayer: Player = {
        socketId: 'socket-1',
        name: 'Test Player',
        avatar: Avatar.Avatar1,
        isActive: true,
        position: { x: 0, y: 0 },
        initialPosition: { x: 0, y: 0 },
        specs: mockSpecs,
        inventory: [ItemCategory.WallBreaker],
        turn: 0,
        visitedTiles: [],
        profile: ProfileType.NORMAL,
    };

    const mockGame: Game = {
        id: 'game-1',
        players: [mockPlayer],
        hasStarted: true,
        currentTurn: 0,
    } as Game;

    beforeAll(() => {
        jasmine.getEnv().allowRespy(true);
    });

    beforeEach(() => {
        playerServiceSpy = jasmine.createSpyObj('PlayerService', ['setPlayerAvatar', 'setPlayerName', 'setPlayer'], { player: mockPlayer });
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['setGame'], { game: mockGame });

        yourTurnSubject = new Subject<Player>();
        playerTurnSubject = new Subject<string>();
        playerWonSubject = new Subject<Player>();
        playerPossibleMovesSubject = new Subject<[string, { path: Coordinate[]; weight: number }][]>();
        positionToUpdateSubject = new Subject<{ game: Game; player: Player }>();
        youFinishedMovingSubject = new Subject<null>();
        youFellSubject = new Subject<Player>();
        yourCombatsSubject = new Subject<Player[]>();

        combatFinishedByEvasionSubject = new Subject<{ updatedGame: Game; evadingPlayer: Player }>();
        combatFinishedSubject = new Subject<{ updatedGame: Game; winner: Player }>();

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
                case 'playerWon':
                    return playerWonSubject.asObservable() as Observable<T>;
                case 'youFinishedMoving':
                    return youFinishedMovingSubject.asObservable() as Observable<T>;
                case 'youFell':
                    return youFellSubject.asObservable() as Observable<T>;
                case 'yourCombats':
                    return yourCombatsSubject.asObservable() as Observable<T>;
                case CombatEvents.CombatFinishedByEvasion:
                    return combatFinishedByEvasionSubject.asObservable() as Observable<T>;
                case CombatEvents.CombatFinished:
                    return combatFinishedSubject.asObservable() as Observable<T>;
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
        spyOn(service, 'resumeTurn').and.callThrough();
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
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
        beforeEach(() => {
            spyOn(service, 'clearMoves').and.callThrough();
            spyOn(service, 'endTurnBecauseFell').and.callThrough();
            service.listenForPlayerMove();
        });

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

        it('should call clearMoves and endTurnBecauseFell on receiving "youFell" event', () => {
            youFellSubject.next(mockPlayer);

            expect(service.clearMoves).toHaveBeenCalled();
            expect(service.endTurnBecauseFell).toHaveBeenCalled();
        });
    });

    describe('#resumeTurn', () => {
        beforeEach(() => {
            spyOn(service, 'getCombats');
            spyOn(service, 'getMoves');
        });

        it('should reset possibleOpponents and possibleDoors, set possibleActions, and call getCombats if actions are not zero', () => {
            service['playerTurn'].next(mockPlayer.name);
            mockPlayer.specs.actions = 2;

            service.resumeTurn();

            service.possibleOpponents$.subscribe((opponents) => {
                expect(opponents).toEqual([]);
            });
            service.possibleDoors$.subscribe((doors) => {
                expect(doors).toEqual([]);
            });

            expect(service.possibleActions.combat).toBeTrue();
            expect(service.possibleActions.door).toBeTrue();
            expect(service.getCombats).toHaveBeenCalled();
            expect(service.getMoves).not.toHaveBeenCalled();
        });

        it('should call getMoves if actions are zero', () => {
            service['playerTurn'].next(mockPlayer.name);
            mockPlayer.specs.actions = 0;

            service.resumeTurn();

            expect(service.getCombats).not.toHaveBeenCalled();
            expect(service.getMoves).toHaveBeenCalled();
        });

        it("should do nothing if it is not the player's turn", () => {
            service['playerTurn'].next('Another Player');

            service.resumeTurn();

            expect(service.getCombats).not.toHaveBeenCalled();
            expect(service.getMoves).not.toHaveBeenCalled();
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

        it('should send endTurn message if youFell is false', () => {
            spyOn(service, 'clearMoves');
            service['youFell'].next(false);

            service.endTurn();

            expect(service.clearMoves).toHaveBeenCalled();
            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('endTurn', mockGame.id);
        });

        it('should not send endTurn message if youFell is true', () => {
            service['youFell'].next(true);

            service.endTurn();

            expect(socketServiceSpy.sendMessage).not.toHaveBeenCalledWith('endTurn', mockGame.id);
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

        it('should reset youFell to false after 3 seconds in endTurnBecauseFell', fakeAsync(() => {
            service['youFell'].next(true);

            service.endTurnBecauseFell();
            tick(3000);

            expect(service['youFell'].getValue()).toBe(false);
        }));
    });

    describe('#listenForTurn', () => {
        beforeEach(() => {
            spyOn(service, 'clearMoves');
            spyOn(service, 'getDoors');
            spyOn(service, 'getCombats');
            service.listenForTurn();
        });

        it('should handle startTurn event for the current player by calling getActions', () => {
            service['playerTurn'].next(mockPlayer.name);
            service.listenForTurn();
            playerTurnSubject.next(mockPlayer.name);

            expect(service.getCombats).toHaveBeenCalled();
        });

        it('should handle "yourTurn" event and update relevant properties', () => {
            const newPlayer: Player = { ...mockPlayer, name: 'New Player' };

            yourTurnSubject.next(newPlayer);

            expect(service.clearMoves).toHaveBeenCalled();
            expect(service['playerTurn'].getValue()).toBe(newPlayer.name);
        });

        it('should update playerTurn and clear moves when "playerTurn" event is received', () => {
            playerTurnSubject.next('Another Player');

            expect(service.clearMoves).toHaveBeenCalled();
            expect(service['playerTurn'].getValue()).toBe('Another Player');
        });
    });

    describe('#getMoves', () => {
        it('should send getMovements message', () => {
            service.getMoves();

            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('getMovements', mockGame.id);
        });
    });

    describe('#listenMoves', () => {
        beforeEach(() => {});
        beforeEach(() => {
            spyOn(service, 'endTurn');
            service.listenMoves();
        });

        it('should update moves with received paths and call endTurn if only one move and already fought or no combats', () => {
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
    });

    describe('#listenForPossibleCombats', () => {
        beforeEach(() => {
            service.listenForPossibleActions();
        });

        it('should set noCombats to true and update possibleOpponents when no opponents are available', () => {
            const emptyOpponents: Player[] = [];

            yourCombatsSubject.next(emptyOpponents);

            service.possibleOpponents$.subscribe((opponents) => {
                expect(opponents).toEqual([]);
            });
        });

        it('should set noCombats to false and update possibleOpponents when opponents are available', () => {
            const mockOpponents: Player[] = [mockPlayer];

            yourCombatsSubject.next(mockOpponents);

            service.possibleOpponents$.subscribe((opponents) => {
                expect(opponents).toEqual(mockOpponents);
            });
        });
    });

    describe('#listenForCombatConclusion', () => {
        beforeEach(() => {
            service.listenForCombatConclusion();
        });

        it('should update playerService and gameService on "combatFinishedByEvasion" when evading player is the same as the current player', fakeAsync(() => {
            const evadingPlayer = { ...mockPlayer, socketId: 'socket-1' };
            const updatedGame = { ...mockGame, players: [evadingPlayer] };
            const combatFinishedByEvasionData = { updatedGame, evadingPlayer };

            combatFinishedByEvasionSubject.next(combatFinishedByEvasionData);
            tick();

            expect(playerServiceSpy.player).toEqual(evadingPlayer);
            expect(gameServiceSpy.setGame).toHaveBeenCalledWith(updatedGame);
        }));

        it('should update playerService and gameService on "combatFinishedByEvasion" when evading player is different from the current player', fakeAsync(() => {
            const evadingPlayer = { ...mockPlayer, socketId: 'socket-2' };
            const updatedGame = { ...mockGame, players: [mockPlayer, evadingPlayer] };
            const combatFinishedByEvasionData = { updatedGame, evadingPlayer };

            combatFinishedByEvasionSubject.next(combatFinishedByEvasionData);
            tick();

            expect(playerServiceSpy.player).toEqual(mockPlayer);
            expect(gameServiceSpy.setGame).toHaveBeenCalledWith(updatedGame);
        }));

        it('should update playerService and gameService on "combatFinished" when winner is the current player', fakeAsync(() => {
            const winner = { ...mockPlayer, socketId: 'socket-1' };
            const updatedGame = { ...mockGame, players: [winner] };
            const combatFinishedData = { updatedGame, winner };

            combatFinishedSubject.next(combatFinishedData);
            tick();

            expect(playerServiceSpy.player).toEqual(winner);
            expect(gameServiceSpy.setGame).toHaveBeenCalledWith(updatedGame);
        }));

        it('should update playerService and gameService on "combatFinished" when winner is different from the current player', fakeAsync(() => {
            const winner = { ...mockPlayer, socketId: 'socket-2' };
            const updatedGame = { ...mockGame, players: [mockPlayer, winner] };
            const combatFinishedData = { updatedGame, winner };

            combatFinishedSubject.next(combatFinishedData);
            tick();

            expect(playerServiceSpy.player).toEqual(mockPlayer);
            expect(gameServiceSpy.setGame).toHaveBeenCalledWith(updatedGame);
        }));
    });

    describe('#toggleDoor', () => {
        const mockDoor = { x: 1, y: 1 } as unknown as DoorTile;

        it('should send "toggleDoor" message when possibleActions.door is true and actionsDone.door is false', () => {
            service.possibleActions.door = true;

            service.toggleDoor(mockDoor);

            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('toggleDoor', { gameId: mockGame.id, door: mockDoor });
        });

        it('should not send "toggleDoor" message when possibleActions.door is false', () => {
            service.possibleActions.door = false;

            service.toggleDoor(mockDoor);

            expect(socketServiceSpy.sendMessage).not.toHaveBeenCalledWith('toggleDoor', { gameId: mockGame.id, door: mockDoor });
        });

        it('should not send "toggleDoor" message when possibleActions.door is false', () => {
            service.possibleActions.door = false;

            service.toggleDoor(mockDoor);

            expect(socketServiceSpy.sendMessage).not.toHaveBeenCalledWith('toggleDoor', { gameId: mockGame.id, door: mockDoor });
        });
    });

    describe('#listenForDoorUpdates', () => {
        const mockPlayerData = {
            game: { ...mockGame },
            player: { ...mockPlayer },
        };

        beforeEach(() => {
            spyOn(service, 'resumeTurn');
            socketServiceSpy.listen.and.returnValue(of(mockPlayerData));
            service.listenForDoorUpdates();
        });

        it('should update player and call resumeTurn if the player matches the current player', () => {
            const spySetPlayer = spyOn(playerServiceSpy, 'setPlayer');

            socketServiceSpy.listen.and.returnValue(of(mockPlayerData));

            socketServiceSpy.listen<{ game: Game; player: Player }>('doorToggled').subscribe((data) => {
                expect(data).toEqual(mockPlayerData);
                expect(spySetPlayer).toHaveBeenCalledWith(mockPlayerData.player);
                expect(service.resumeTurn).toHaveBeenCalled();
            });
        });

        it('should update game data from the event', () => {
            const spySetGame = spyOn(gameServiceSpy, 'setGame');

            socketServiceSpy.listen.and.returnValue(of(mockPlayerData));

            socketServiceSpy.listen<{ game: Game; player: Player }>('doorToggled').subscribe((data) => {
                expect(spySetGame).toHaveBeenCalledWith(data.game);
            });
        });
    });
    describe('#listenForWallBreaking', () => {
        beforeEach(() => {
            spyOn(service, 'resumeTurn');
            service.listenForWallBreaking();
        });

        it('should update player and call resumeTurn if the player matches the current player', () => {
            const mockPlayerData = { game: mockGame, player: mockPlayer };
            spyOn(playerServiceSpy, 'setPlayer').and.callThrough();
            spyOn(service, 'resumeTurn').and.callThrough();

            socketServiceSpy.listen.and.returnValue(of(mockPlayerData));

            service.listenForWallBreaking();

            expect(playerServiceSpy.setPlayer).toHaveBeenCalledWith(mockPlayerData.player);
            expect(service.resumeTurn).toHaveBeenCalled();
        });

        it('should update game data from the event', () => {
            const mockPlayerData = { game: mockGame, player: mockPlayer };

            socketServiceSpy.listen.and.returnValue(of(mockPlayerData));

            service.listenForWallBreaking();

            expect(gameServiceSpy.setGame).toHaveBeenCalledWith(mockPlayerData.game);
        });

        it('should not call resumeTurn if the player does not match the current player', () => {
            const mockPlayerData = { game: mockGame, player: { ...mockPlayer, socketId: 'socket-3' } };
            socketServiceSpy.listen.and.returnValue(of(mockPlayerData));

            socketServiceSpy.listen<{ game: Game; player: Player }>('wallBroken').subscribe(() => {
                const spySetPlayer = spyOn(playerServiceSpy, 'setPlayer');
                expect(spySetPlayer).not.toHaveBeenCalled();
                expect(service.resumeTurn).not.toHaveBeenCalled();
            });
        });
    });
    describe('#listenForCombatStarted', () => {
        beforeEach(() => {
            service.listenForCombatStarted();
            socketServiceSpy.listen.and.returnValue(of(mockPlayer));
        });

        it('should not update the player if the socket ID does not match the current player', () => {
            const mockCombatPlayer = { ...mockPlayer, socketId: 'socket-2' };
            const spySetPlayer = spyOn(playerServiceSpy, 'setPlayer');

            socketServiceSpy.listen.and.returnValue(of(mockCombatPlayer));

            socketServiceSpy.listen<Player>(CombatEvents.YouStartedCombat).subscribe((player) => {
                expect(player).toEqual(mockCombatPlayer);
                expect(spySetPlayer).not.toHaveBeenCalled();
            });
        });
        it('should reset possibleOpponents, possibleDoors, set possibleActions, and call getCombats if actions are not zero', () => {
            service['playerTurn'].next(mockPlayer.name);
            mockPlayer.specs.actions = 2;
            mockPlayer.inventory.push(ItemCategory.WallBreaker);

            spyOn(service, 'getCombats');
            spyOn(service, 'getDoors');
            spyOn(service, 'getWalls');

            service.resumeTurn();

            service.possibleOpponents$.subscribe((opponents) => {
                expect(opponents).toEqual([]);
            });
            service.possibleDoors$.subscribe((doors) => {
                expect(doors).toEqual([]);
            });

            expect(service.possibleActions.combat).toBeTrue();
            expect(service.possibleActions.door).toBeTrue();
            expect(service.possibleActions.wall).toBeTrue();
            expect(service.getCombats).toHaveBeenCalled();
            expect(service.getDoors).toHaveBeenCalled();
            expect(service.getWalls).toHaveBeenCalled();
        });
    });
    describe('#listenForTurn', () => {
        beforeEach(() => {
            spyOn(service, 'clearMoves');
            spyOn(service, 'getCombats');
            spyOn(service, 'getDoors');
            spyOn(service, 'getWalls');
            service.listenForTurn();
        });

        it('should clear moves and update playerTurn on "yourTurn" event', () => {
            const newPlayer: Player = { ...mockPlayer, name: 'Test Player' };
            yourTurnSubject.next(newPlayer);

            expect(service.clearMoves).toHaveBeenCalled();
            expect(service['playerTurn'].getValue()).toBe(newPlayer.name);
            expect(playerServiceSpy.player).toEqual(newPlayer);
        });

        it('should clear moves and update playerTurn on "playerTurn" event', () => {
            playerTurnSubject.next('Another Player');

            expect(service.clearMoves).toHaveBeenCalled();
            expect(service['playerTurn'].getValue()).toBe('Another Player');
            expect(service['youFell'].getValue()).toBe(false);
        });

        it('should call getCombats and set possibleActions on "startTurn" event if it is the player\'s turn', () => {
            service['playerTurn'].next(mockPlayer.name);
            service.listenForTurn();
            playerTurnSubject.next(mockPlayer.name);

            expect(service.possibleActions.combat).toBeTrue();
            expect(service.possibleActions.door).toBeTrue();
            expect(service.getCombats).toHaveBeenCalled();
        });

        it("should not call getCombats if it is not the player's turn", () => {
            service['playerTurn'].next('Another Player');
            service.listenForTurn();
            playerTurnSubject.next('Another Player');

            expect(service.getCombats).not.toHaveBeenCalled();
        });
    });
    describe('#getCombats', () => {
        it('should send getCombats message with correct game id', () => {
            service.getCombats();
            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('getCombats', mockGame.id);
        });
    });
    describe('#getWalls', () => {
        it('should send getAdjacentWalls message with correct game id', () => {
            service.getWalls();
            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('getAdjacentWalls', mockGame.id);
        });
    });
    describe('#breakWall', () => {
        const mockWall = { x: 1, y: 1 } as unknown as Tile;

        it('should send "breakWall" message when possibleActions.wall is true', () => {
            service.possibleActions.wall = true;

            service.breakWall(mockWall);

            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('breakWall', { gameId: mockGame.id, wall: mockWall });
            expect(service.possibleActions.wall).toBeFalse();
        });

        it('should not send "breakWall" message when possibleActions.wall is false', () => {
            service.possibleActions.wall = false;

            service.breakWall(mockWall);

            expect(socketServiceSpy.sendMessage).not.toHaveBeenCalled();
        });
    });
    describe('#listenForEndOfGame', () => {
        it('should set playerWon to true when GameFinishedPlayerWon event is received', (done) => {
            const playerWonSubject = new Subject<Player>();
            socketServiceSpy.listen.and.returnValue(playerWonSubject.asObservable());

            service.listenForEndOfGame();

            service.playerWon$.subscribe((playerWon) => {
                if (playerWon) {
                    expect(playerWon).toBeTrue();
                    done();
                }
            });

            playerWonSubject.next(mockPlayer);
        });

        it('should reset playerWon to false initially', (done) => {
            service.listenForEndOfGame();

            service.playerWon$.subscribe((playerWon) => {
                expect(playerWon).toBeFalse();
                done();
            });
        });
    });
});
