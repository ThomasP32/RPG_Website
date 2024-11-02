import { Component, Input } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { GamePageComponent } from '@app/pages/game-page/game-page';
import { CharacterService } from '@app/services/character/character.service';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { CountdownService } from '@app/services/countdown/countdown.service';
import { GameTurnService } from '@app/services/game-turn/game-turn.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player-service/player.service';
import { Avatar, Bonus, Game, Player } from '@common/game';
import { Coordinate, Mode } from '@common/map.types';
import { Observable, of, Subject } from 'rxjs';

@Component({
    selector: 'app-game-map',
    template: '', // Pas de template, juste un stub pour le test
})
class GameMapStubComponent {
    @Input() map: Game; // Déclaration de l'input sans logique
}

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;

    let mockActivatedRoute: any;
    let mockRouter: any;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let characterServiceSpy: jasmine.SpyObj<CharacterService>;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;
    let gameTurnServiceSpy: jasmine.SpyObj<GameTurnService>;
    let countdownServiceSpy: jasmine.SpyObj<CountdownService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    let playerLeftSubject: Subject<Player[]>;
    let currentGameSubject: Subject<Game>;
    let countdownSubject: Subject<number>;
    let playerTurnSubject = new Subject<string>();
    let youFellSubject = new Subject<boolean>();

    const mockPlayer: Player = {
        socketId: 'test-socket',
        name: 'Test Player',
        avatar: Avatar.Avatar1,
        isActive: true,
        position: { x: 0, y: 0 },
        specs: {
            life: 100,
            speed: 10,
            attack: 10,
            defense: 10,
            movePoints: 5,
            actions: 2,
            attackBonus: Bonus.D4,
            defenseBonus: Bonus.D6,
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
            nEvasions: 0,
            nLifeTaken: 0,
            nLifeLost: 0,
        },
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
        players: [],
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

    beforeEach(async () => {
        mockActivatedRoute = {
            snapshot: {
                params: { gameId: 'test-game-id' },
            },
        };
        mockRouter = {
            url: '/game-page',
            navigate: jasmine.createSpy('navigate'),
        };

        socketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage', 'listen', 'disconnect']);
        characterServiceSpy = jasmine.createSpyObj('CharacterService', ['getAvatarPreview', 'resetCharacterAvailability']);
        playerServiceSpy = jasmine.createSpyObj('PlayerService', ['setPlayer', 'resetPlayer'], { player: mockPlayer });
        gameTurnServiceSpy = jasmine.createSpyObj(
            'GameTurnService',
            ['listenForTurn', 'endTurn', 'movePlayer', 'listenForPlayerMove', 'listenMoves', 'endGame'],
            {
                playerTurn$: playerTurnSubject,
                youFell$: youFellSubject,
                moves: new Map(),
            },
        );
        gameServiceSpy = jasmine.createSpyObj('GameService', ['setGame'], { game: mockGame });
        countdownServiceSpy = jasmine.createSpyObj('CountdownService', ['resetCountdown', 'pauseCountdown', 'startCountdown'], {
            countdown$: new Subject<number>(),
        });

        playerLeftSubject = new Subject<Player[]>();
        currentGameSubject = new Subject<Game>();
        countdownSubject = countdownServiceSpy.countdown$;

        socketServiceSpy.listen.and.callFake(<T>(eventName: string): Observable<T> => {
            switch (eventName) {
                case 'playerLeft':
                    return playerLeftSubject.asObservable() as Observable<T>;
                case 'currentGame':
                    return currentGameSubject.asObservable() as Observable<T>;
                default:
                    return of();
            }
        });

        await TestBed.configureTestingModule({
            imports: [GamePageComponent],
            declarations: [GameMapStubComponent],
            providers: [
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: Router, useValue: mockRouter },
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: CharacterService, useValue: characterServiceSpy },
                { provide: PlayerService, useValue: playerServiceSpy },
                { provide: GameTurnService, useValue: gameTurnServiceSpy },
                { provide: CountdownService, useValue: countdownServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        fixture.autoDetectChanges(false);

        component.activePlayers = [mockPlayer];
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should initialize gameId, load game data, and reset countdown', () => {
            spyOn(component, 'listenForCountDown').and.callThrough();
            component.ngOnInit();

            expect(component.game.id).toBe('test-game-id');
            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('startGame', 'test-game-id');
            expect(countdownServiceSpy.resetCountdown).toHaveBeenCalled();
            expect(component.listenForCountDown).toHaveBeenCalled();
        });

        it('should start the game if the player is the host', () => {
            component.ngOnInit();
            currentGameSubject.next(mockGame);

            expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith('startGame', 'test-game-id');
        });
    });

    describe('listenForCountDown', () => {
        it('should update countdown and trigger pulse', fakeAsync(() => {
            component.listenForCountDown();
            countdownSubject.next(10);

            expect(component.countdown).toBe(10);
            tick(1500);
            fixture.detectChanges();
            expect(component.isPulsing).toBeFalse();
        }));

        it('should call endTurn when countdown reaches zero', () => {
            component.listenForCountDown();
            countdownSubject.next(0);

            expect(gameTurnServiceSpy.endTurn).toHaveBeenCalled();
        });
    });

    describe('listenPlayersLeft', () => {
        it('should show kicked modal and navigate when only one player remains', fakeAsync(() => {
            component.listenPlayersLeft();
            playerLeftSubject.next([{ ...mockPlayer, isActive: true }]);

            expect(component.showKickedModal).toBeTrue();
            tick(3000);
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/main-menu']);
        }));
    });

    describe('playTurn', () => {
        it('should start countdown after delay', fakeAsync(() => {
            component.playTurn();
            tick(3000);
            expect(countdownServiceSpy.startCountdown).toHaveBeenCalled();
        }));
    });

    describe('confirmExit', () => {
        it('should navigate to main menu and reset character and player data', () => {
            component.confirmExit();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/main-menu']);
            expect(characterServiceSpy.resetCharacterAvailability).toHaveBeenCalled();
            expect(playerServiceSpy.resetPlayer).toHaveBeenCalled();
        });
    });

    describe('ngOnDestroy', () => {
        it('should disconnect socket and send leave game message', () => {
            component.ngOnDestroy();
            expect(socketServiceSpy.disconnect).toHaveBeenCalled();
        });
    });

    describe('openExitConfirmationModal', () => {
        it('should set showExitModal to true', () => {
            component.openExitConfirmationModal();
            expect(component.showExitModal).toBeTrue();
        });
    });

    describe('closeExitModal', () => {
        it('should set showExitModal to false', () => {
            component.showExitModal = true;

            component.closeExitModal();
            expect(component.showExitModal).toBeFalse();
        });
    });

    describe('listenForCurrentPlayerUpdates', () => {
        it('should set isYourTurn to true when the emitted player is the current player', () => {
            component.listenForCurrentPlayerUpdates();

            playerServiceSpy.player = { ...mockPlayer, name: 'Test Player' };

            playerTurnSubject.next('Test Player');

            expect(component.isYourTurn).toBeTrue();
        });

        it('should call playTurn when playerTurn$ emits a value', () => {
            spyOn(component, 'playTurn');

            component.listenForCurrentPlayerUpdates();

            playerTurnSubject.next('Another Player');

            expect(component.playTurn).toHaveBeenCalled();
        });
    });
    describe('listenForFalling', () => {
        it('should set youFell to true when youFell$ emits true', () => {
            component.listenForFalling();

            youFellSubject.next(true);

            expect(component.youFell).toBeTrue();
        });

        it('should call pauseCountdown when youFell$ emits', () => {
            component.listenForFalling();

            youFellSubject.next(false);

            expect(countdownServiceSpy.pauseCountdown).toHaveBeenCalled();
        });
    });

    describe('retrieve from service', () => {
        it('should retrieve player from playerService', () => {
            expect(component.player).toBe(mockPlayer);
            expect(playerServiceSpy.player).toBe(mockPlayer);
        });

        it('should retrieve game from gameService', () => {
            expect(component.game).toBe(mockGame);
            expect(gameServiceSpy.game).toBe(mockGame);
        });

        it('should retrieve player from playerService using get player()', () => {
            const player = component.player;  
            expect(player).toBe(mockPlayer);
        });
    
        it('should retrieve game from gameService using get game()', () => {
            const game = component.game; 
            expect(game).toBe(mockGame);
        });
    });

    describe('triggerPulse', () => {
        it('should set isPulsing to true briefly and then reset to false', fakeAsync(() => {
            component.triggerPulse();
            expect(component.isPulsing).toBeTrue(); 
            tick(500);  
            expect(component.isPulsing).toBeFalse(); 
        }));
    });

    describe('onTileClickToMove', () => {
        it('should call gameTurnService movePlayer with the correct position', () => {
            const position: Coordinate = { x: 2, y: 3 };
            component.onTileClickToMove(position);
            expect(gameTurnServiceSpy.movePlayer).toHaveBeenCalledWith(position);
        });
    });
});
