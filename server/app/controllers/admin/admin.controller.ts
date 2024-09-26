import { Map } from '@app/model/database/map';
import { CreateMapDto } from '@app/model/dto/map/create-map.dto';
import { UpdateMapDto } from '@app/model/dto/map/update-map.dto';
import { AdminService } from '@app/services/admin/admin.service';
import { Body, Controller, Get, HttpStatus, Param, Patch, Post, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Admin') // to attach a controller to a specific tag
@Controller('admin') // marque la classe comme un contrôleur pour les routes qui commence avec map donc reponde au requete http faites vers l'url /map
export class AdminController {
    constructor(private readonly adminService: AdminService) {} // créé une instance de la classe avec un service de cours

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
            const allCourses = await this.adminService.getAllMaps();
            response.status(HttpStatus.OK).json(allCourses);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Get map by ID',
        type: Map,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/:mapId')
    async getMapById(@Param('mapId') mapId: string, @Res() response: Response) {
        try {
            const course = await this.adminService.getMapById(mapId);
            response.status(HttpStatus.OK).json(course);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiCreatedResponse({
        description: 'Add new map',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Post('/creation')
    async addMap(@Body() mapDto: CreateMapDto, @Res() response: Response) {
        try {
            await this.adminService.addMap(mapDto);
            response.status(HttpStatus.CREATED).send();
        } catch (error) {
            if (error.message === 'A map with this name already exists') {
                return response.status(HttpStatus.CONFLICT).json({
                    status: HttpStatus.CONFLICT,
                    message: 'Map creation failed',
                    details: {
                        reason: 'A map with this name already exists',
                    },
                });
            } else if (error.message === 'All elements must be inside map') {
                return response.status(HttpStatus.FORBIDDEN).json({
                    status: HttpStatus.FORBIDDEN,
                    message: 'Map creation failed',
                    details: {
                        reason: 'All elements must be inside map',
                    },
                });
            } else if (error.message === 'Map must contain more than 50% of ground tiles') {
                return response.status(HttpStatus.FORBIDDEN).json({
                    status: HttpStatus.FORBIDDEN,
                    message: 'Map creation failed',
                    details: {
                        reason: 'Map must contain more than 50% of ground tiles',
                        solution: 'Try reducing number of special tiles',
                    },
                });
            } else if (error.message === 'Map must not have any isolated ground tile') {
                return response.status(HttpStatus.FORBIDDEN).json({
                    status: HttpStatus.FORBIDDEN,
                    message: 'Map creation failed',
                    details: {
                        reason: 'Map must not have any isolated ground tile',
                        solution: 'Try changing wall placement or adding doors',
                    },
                });
            } else if (error.message === 'All doors must be free') {
                return response.status(HttpStatus.FORBIDDEN).json({
                    status: HttpStatus.FORBIDDEN,
                    message: 'Map creation failed',
                    details: {
                        reason: 'All doors must be surrounded by walls and the pathways must be clear',
                        solution: 'Surround doors with walls or clear pathways',
                    },
                });
            } else if (error.message === 'All start tiles must be placed') {
                return response.status(HttpStatus.FORBIDDEN).json({
                    status: HttpStatus.FORBIDDEN,
                    message: 'Map creation failed',
                    details: {
                        reason: 'All start tiles must be placed',
                    },
                });
            } else {
                console.log(error);
                response.status(HttpStatus.NOT_FOUND).send(error);
            }
        }
    }

    @ApiOkResponse({
        description: 'Modify a map',
        type: Map,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Patch('/edition/:mapId')
    async modifyMap(@Param('mapId') mapId: string, @Body() mapDto: UpdateMapDto, @Res() response: Response) {
        try {
            const updatedMap = await this.adminService.modifyMap(mapId, mapDto);
            response.status(HttpStatus.OK).json(updatedMap);
        } catch (error) {
            if (error.message === 'A map with this name already exists') {
                return response.status(HttpStatus.CONFLICT).json({
                    status: HttpStatus.CONFLICT,
                    message: 'Map creation failed',
                    details: {
                        reason: 'A map with this name already exists',
                    },
                });
            } else if (error.message === 'All elements must be inside map') {
                return response.status(HttpStatus.FORBIDDEN).json({
                    status: HttpStatus.FORBIDDEN,
                    message: 'Map creation failed',
                    details: {
                        reason: 'All elements must be inside map',
                    },
                });
            } else if (error.message === 'Map must contain more than 50% of ground tiles') {
                return response.status(HttpStatus.FORBIDDEN).json({
                    status: HttpStatus.FORBIDDEN,
                    message: 'Map creation failed',
                    details: {
                        reason: 'Map must contain more than 50% of ground tiles',
                        solution: 'Try reducing number of special tiles',
                    },
                });
            } else if (error.message === 'Map must not have any isolated ground tile') {
                return response.status(HttpStatus.FORBIDDEN).json({
                    status: HttpStatus.FORBIDDEN,
                    message: 'Map creation failed',
                    details: {
                        reason: 'Map must not have any isolated ground tile',
                        solution: 'Try changing wall placement or adding doors',
                    },
                });
            } else if (error.message === 'All doors must be free') {
                return response.status(HttpStatus.FORBIDDEN).json({
                    status: HttpStatus.FORBIDDEN,
                    message: 'Map creation failed',
                    details: {
                        reason: 'All doors must be surrounded by walls and the pathways must be clear',
                        solution: 'Surround doors with walls or clear pathways',
                    },
                });
            } else if (error.message === 'All start tiles must be placed') {
                return response.status(HttpStatus.FORBIDDEN).json({
                    status: HttpStatus.FORBIDDEN,
                    message: 'Map creation failed',
                    details: {
                        reason: 'All start tiles must be placed',
                    },
                });
            } else {
                console.log(error);
                response.status(HttpStatus.NOT_FOUND).send(error);
            }
        }
    }

    @ApiOkResponse({
        description: 'Modify a map',
        type: Map,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Patch('/:mapId')
    async visibilityToggle(@Param('mapId') mapId: string, @Res() response: Response) {
        try {
            const map = await this.adminService.visibilityToggle(mapId);
            response.status(HttpStatus.OK).json(map);
        } catch (error) {
            console.log(error);
            response.status(HttpStatus.NOT_FOUND).send(error);
        }
    }
}
