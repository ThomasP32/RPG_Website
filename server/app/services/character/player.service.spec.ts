import { PlayerDto } from '@app/model/dto/player/player.dto';
import { Player } from '@app/model/dto/player/player.schema';
import { UpdatePlayerDto } from '@app/model/dto/player/update-player.dto';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { PlayerService } from './player.service';

describe('PlayerService', () => {
    let service: PlayerService;

    const mockPlayerModel = {
        find: jest.fn(),
        findById: jest.fn(),
        findOne: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        create: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PlayerService,
                {
                    provide: getModelToken(Player.name),
                    useValue: mockPlayerModel,
                },
            ],
        }).compile();

        service = module.get<PlayerService>(PlayerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAllPlayersFromGame', () => {
        it('should return an array of players', async () => {
            const players = [{ name: 'Player1' }];
            mockPlayerModel.find.mockReturnValue(players);
            const result = await service.getAllPlayersFromGame('gameId');
            expect(result).toEqual(players);
            expect(mockPlayerModel.find).toHaveBeenCalledWith({ gameId: 'gameId' });
        });
    });

    describe('getPlayerById', () => {
        it('should return a player', async () => {
            const player = { name: 'Player1' };
            mockPlayerModel.findById.mockReturnValue(player);
            const result = await service.getPlayerById('playerId');
            expect(result).toEqual(player);
            expect(mockPlayerModel.findById).toHaveBeenCalledWith({ playerId: 'playerId' });
        });

        it('should throw an error if player not found', async () => {
            mockPlayerModel.findById.mockReturnValue(null);
            await expect(service.getPlayerById('playerId')).rejects.toThrow('Failed to find player with id : playerId');
        });
    });

    describe('updatePlayer', () => {
        it('should update and return the player', async () => {
            const player = { name: 'Player1' };
            const updatePlayerDto: UpdatePlayerDto = { life: 100, attack: 50, defense: 30, speed: 20 };
            mockPlayerModel.findByIdAndUpdate.mockReturnValue(player);
            const result = await service.updatePlayer('playerId', updatePlayerDto);
            expect(result).toEqual(player);
            expect(mockPlayerModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'playerId',
                {
                    $set: {
                        health: updatePlayerDto.life,
                        attack: updatePlayerDto.attack,
                        defense: updatePlayerDto.defense,
                        speed: updatePlayerDto.speed,
                    },
                },
                { new: true },
            );
        });
    });

    describe('addPlayer', () => {
        it('should create a new player', async () => {
            const playerDto: PlayerDto = {
                name: 'Player1',
                gameId: 'gameId',
                avatarType: 1,
                speed: 10,
                attack: 20,
                life: 100,
                defense: 30,
            };
            mockPlayerModel.create.mockReturnValue(playerDto);
            await service.addPlayer(playerDto);
            expect(mockPlayerModel.create).toHaveBeenCalledWith(playerDto);
        });
    });
});
