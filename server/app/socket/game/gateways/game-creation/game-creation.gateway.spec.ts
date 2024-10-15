import { GameCreationService } from '@app/socket/game/service/game-creation/game-creation.service';
import { Game, Player } from '@common/game';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { GameGateway } from './game-creation.gateway';

describe('GameGateway', () => {
    let gateway: GameGateway;
    let logger: SinonStubbedInstance<Logger>;
    let socket: SinonStubbedInstance<Socket>;
    let gameCreationService: SinonStubbedInstance<GameCreationService>;
    let serverStub: SinonStubbedInstance<Server>;

    beforeEach(async () => {
        logger = createStubInstance(Logger);
        socket = createStubInstance<Socket>(Socket);
        gameCreationService = createStubInstance<GameCreationService>(GameCreationService);
        serverStub = createStubInstance<Server>(Server);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameGateway,
                {
                    provide: Logger,
                    useValue: logger,
                },
                {
                    provide: GameCreationService,
                    useValue: gameCreationService,
                },
            ],
        }).compile();

        gateway = module.get<GameGateway>(GameGateway);

        gateway['server'] = serverStub;

        serverStub.to.returns({
            emit: stub(),
        } as any);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('handleStartGame', () => {
        it('should start the game and call addGame on GameCreationService', () => {
            const newGame: Game = { id: '1234', hostSocketId: '', players: [] } as Game;

            gateway.handleStartGame(socket, newGame);

            expect(socket.join.calledWith('1234')).toBeTruthy();
            expect(newGame.hostSocketId).toEqual(socket.id);
            expect(gameCreationService.addGame.calledWith(newGame)).toBeTruthy();
        });
    });

    describe('handleJoinGame', () => {
        it('should add player to game and call addPlayerToGame on GameCreationService', () => {
            const player: Player = { name: 'Player1', socketId: 'socket-id', isActive: true } as Player;
            const gameId = 'game-id';
            const updatedGame: Game = { id: gameId, players: [player] } as Game;

            gameCreationService.addPlayerToGame.returns(updatedGame);

            gateway.handleJoinGame(socket, { player, gameId });

            expect(socket.join.calledWith(gameId)).toBeTruthy();
            expect(gameCreationService.addPlayerToGame.calledWith(player, gameId)).toBeTruthy();
        });
    });

    describe('handleDisconnect', () => {
        it('should call deleteRoom when the player is the host', () => {
            const gameId = 'game-id';
            stub(socket, 'rooms').value(new Set([gameId, 'client-id']));
            gameCreationService.isPlayerHost.returns(true);

            gateway.handleDisconnect(socket);

            expect(gameCreationService.isPlayerHost.calledWith(socket.id, gameId)).toBeTruthy();
            expect(gameCreationService.deleteRoom.calledWith(gameId)).toBeTruthy();
        });

        it('should call handlePlayerDisconnect when the player is not the host', () => {
            const gameId = 'game-id';
            const updatedGame: Game = { id: gameId, players: [] } as Game;
            stub(socket, 'rooms').value(new Set([gameId, 'client-id']));
            gameCreationService.isPlayerHost.returns(false);
            gameCreationService.handlePlayerDisconnect.returns(updatedGame);

            gateway.handleDisconnect(socket);

            expect(gameCreationService.isPlayerHost.calledWith(socket.id, gameId)).toBeTruthy();
            expect(gameCreationService.handlePlayerDisconnect.calledWith(socket)).toBeTruthy();
        });
    });
});
