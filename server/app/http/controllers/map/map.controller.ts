import { Map } from '@app/http/model/schemas/map/map.schema';
import { MapService } from '@app/http/services/map/map.service';
import { BadRequestException, Body, Controller, Get, HttpStatus, Inject, Param, Post, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Map')
@Controller('map')
export class MapController {
    @Inject(MapService) private readonly mapService: MapService;

    @ApiOkResponse({
        description: 'Returns all maps',
        type: Map,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/')
    async allMaps(@Res() response: Response) {
        try {
            const maps = await this.mapService.getAllVisibleMaps();
            response.status(HttpStatus.OK).json(maps);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Get map by name',
        type: Map,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/:mapName')
    async getMapByName(@Param('mapName') mapName: string, @Res() response: Response) {
        try {
            const map = await this.mapService.getMapByName(mapName);
            response.status(HttpStatus.OK).json(map);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @Post('import')
    @UsePipes(new ValidationPipe({ transform: true }))
    async importMap(@Body() mapDto: any) {
        try {
            const parsedMapDto = typeof mapDto === 'string' ? JSON.parse(mapDto) : mapDto;

            console.log('Parsed map data:', parsedMapDto);

            return this.mapService.validateAndSaveMap(parsedMapDto);
        } catch (error) {
            console.error('Error parsing map data:', error);
            throw new BadRequestException('Invalid JSON format');
        }
    }
}
