import { Map } from '@app/model/schemas/map.schema';
import { MapService } from '@app/services/map/map.service';
import { Controller, Get, HttpStatus, Inject, Param, Res } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Map') // to attach a controller to a specific tag
@Controller('map') // marque la classe comme un contrôleur pour les routes qui commence avec map donc reponde au requete http faites vers l'url /map
export class MapController {
    @Inject(MapService)private readonly mapService: MapService; // créé une instance de la classe avec un service de cours

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
            const allCourses = await this.mapService.getAllVisibleMaps();
            response.status(HttpStatus.OK).json(allCourses);
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
