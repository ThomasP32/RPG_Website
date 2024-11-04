import { Map } from '@app/http/model/schemas/map/map.schema';
import { MapService } from '@app/http/services/map/map.service';
import { Controller, Get, HttpStatus, Inject, Param, Res } from '@nestjs/common';
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
}
