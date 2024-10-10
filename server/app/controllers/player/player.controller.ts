import { PlayerDto } from '@app/model/dto/player/player.dto';
import { Player } from '@app/model/dto/player/player.schema';
import { UpdatePlayerDto } from '@app/model/dto/player/update-player.dto';
import { PlayerService } from '@app/services/character/player.service';
import { Body, Controller, Get, HttpStatus, Inject, Param, Patch, Post, Res } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Player')
@Controller('player')
export class PlayerController {
    @Inject(PlayerService) private readonly playerService: PlayerService;

    @ApiOkResponse({
        description: 'Returns all players of a given game',
        type: Player,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/:gameId')
    async allPlayers(@Param('gameId') gameId: string, @Res() response: Response) {
        try {
            const allPlayers = await this.playerService.getAllPlayersFromGame(gameId);
            response.status(HttpStatus.OK).json(allPlayers);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Returns player by ID',
        type: Player,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/:playerId')
    async getPlayerById(@Param('playerId') playerId: string, @Res() response: Response) {
        try {
            const player = await this.playerService.getPlayerById(playerId);
            response.status(HttpStatus.OK).json(player);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiCreatedResponse({
        description: 'Add new player',
    })
    @ApiBadRequestResponse({
        description: 'Return BAD_REQUEST http status when request fails',
    })
    @Post('/')
    async addMap(@Body() playerDto: PlayerDto, @Res() response: Response) {
        try {
            await this.playerService.addPlayer(playerDto);
            response.status(HttpStatus.CREATED).send();
        } catch (error) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                status: error.status || HttpStatus.BAD_REQUEST,
                message: error.message || 'La création du joueur a échoué',
            });
        }
    }

    @ApiOkResponse({
        description: 'update player specs',
        type: Player,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Patch('/:playerId')
    async updatePlayerSpecs(@Param('playerId') playerId: string, @Body() updatePlayerDto: UpdatePlayerDto, @Res() response: Response) {
        try {
            const map = await this.playerService.updatePlayer(playerId, updatePlayerDto);
            response.status(HttpStatus.OK).json(map);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }
}
