import { PlayerDto } from '@app/model/dto/player/player.dto';
import { UpdatePlayerDto } from '@app/model/dto/player/update-player.dto';
import { PlayerService } from '@app/services/character/player.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { PlayerController } from './player.controller';

describe('PlayerController', () => {
    let controller: PlayerController;
    let playerService: PlayerService;

    const mockPlayerService = {
        getAllPlayersFromGame: jest.fn(),
        getPlayerById: jest.fn(),
        getPlayerByName: jest.fn(),
        addPlayer: jest.fn(),
        updatePlayer: jest.fn(),
    };

    const mockResponse = () => {
        const res = {} as Response;
        res.status = jest.fn().mockReturnThis();
        res.json = jest.fn().mockReturnThis();
        res.send = jest.fn().mockReturnThis();
        return res;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PlayerController],
            providers: [
                {
                    provide: PlayerService,
                    useValue: mockPlayerService,
                },
            ],
        }).compile();

        controller = module.get<PlayerController>(PlayerController);
        playerService = module.get<PlayerService>(PlayerService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('allPlayers', () => {
        it('should return an array of players', async () => {
            const res = mockResponse();
            const players = [{ name: 'Player1' }];
            mockPlayerService.getAllPlayersFromGame.mockResolvedValue(players);

            await controller.allPlayers('gameId', res);
            expect(playerService.getAllPlayersFromGame).toHaveBeenCalledWith('gameId');
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.json).toHaveBeenCalledWith(players);
        });

        it('should return NOT_FOUND when service throws an error', async () => {
            const res = mockResponse();
            mockPlayerService.getAllPlayersFromGame.mockRejectedValue(new Error('Error'));

            await controller.allPlayers('gameId', res);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
            expect(res.send).toHaveBeenCalledWith('Error');
        });
    });

    describe('getPlayerById', () => {
        it('should return a player', async () => {
            const res = mockResponse();
            const player = { name: 'Player1' };
            mockPlayerService.getPlayerById.mockResolvedValue(player);

            await controller.getPlayerById('playerId', res);
            expect(playerService.getPlayerById).toHaveBeenCalledWith('playerId');
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.json).toHaveBeenCalledWith(player);
        });

        it('should return NOT_FOUND when service throws an error', async () => {
            const res = mockResponse();
            mockPlayerService.getPlayerById.mockRejectedValue(new Error('Error'));

            await controller.getPlayerById('playerId', res);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
            expect(res.send).toHaveBeenCalledWith('Error');
        });
    });


    describe('addPlayer', () => {
        it('should create a new player', async () => {
            const res = mockResponse();
            const playerDto: PlayerDto = {
                name: 'Player1',
                gameId: 'gameId',
                avatarType: 1,
                speed: 10,
                attack: 20,
                life: 100,
                defense: 30,
            };
            mockPlayerService.addPlayer.mockResolvedValue(undefined);

            await controller.addMap(playerDto, res);
            expect(playerService.addPlayer).toHaveBeenCalledWith(playerDto);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
            expect(res.send).toHaveBeenCalled();
        });

        it('should return BAD_REQUEST when service throws an error', async () => {
            const res = mockResponse();
            mockPlayerService.addPlayer.mockRejectedValue(new Error('Creation failed'));

            await controller.addMap({} as PlayerDto, res);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
            expect(res.json).toHaveBeenCalledWith({
                status: HttpStatus.BAD_REQUEST,
                message: 'Creation failed',
            });
        });

        it('should return BAD_REQUEST when service throws an error without message', async () => {
            const res = mockResponse();
            const error = {}; // Error object without a message
            mockPlayerService.addPlayer.mockRejectedValue(error);

            await controller.addMap({} as PlayerDto, res);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
            expect(res.json).toHaveBeenCalledWith({
                status: HttpStatus.BAD_REQUEST,
                message: 'La création du joueur a échoué', 
            });
        });
    });

    describe('updatePlayerSpecs', () => {
        it('should update player specs and return the updated player', async () => {
            const res = mockResponse();
            const player = { name: 'Player1' };
            const updatePlayerDto: UpdatePlayerDto = { life: 100, attack: 50, defense: 30, speed: 20 };
            mockPlayerService.updatePlayer.mockResolvedValue(player);

            await controller.updatePlayerSpecs('playerId', updatePlayerDto, res);
            expect(playerService.updatePlayer).toHaveBeenCalledWith('playerId', updatePlayerDto);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.json).toHaveBeenCalledWith(player);
        });

        it('should return NOT_FOUND when service throws an error', async () => {
            const res = mockResponse();
            mockPlayerService.updatePlayer.mockRejectedValue(new Error('Update failed'));

            await controller.updatePlayerSpecs('playerId', {} as UpdatePlayerDto, res);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
            expect(res.send).toHaveBeenCalledWith('Update failed');
        });
    });
});
