import { MapDto } from '@app/http/model/dto/map/map.dto';
import { Map } from '@app/http/model/schemas/map/map.schema';
import { AdminService } from '@app/http/services/admin/admin.service';
import { Body, Controller, Delete, Get, HttpStatus, Inject, Param, Patch, Post, Put, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Admin') 
@Controller('admin')
export class AdminController {
    @Inject(AdminService) private readonly adminService: AdminService; 

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
            const map = await this.adminService.getMapById(mapId);
            response.status(HttpStatus.OK).json(map);
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
    async addMap(@Body() mapDto: MapDto, @Res() response: Response) {
        try {
            await this.adminService.addMap(mapDto);
            response.status(HttpStatus.CREATED).send();
        } catch (error) {
            console.log(error.status);
            console.log(error.message);
            return response.status(error.status || HttpStatus.BAD_REQUEST).json({
                status: error.status || HttpStatus.BAD_REQUEST,
                message: error.message || 'La création du jeu a échoué',
            });
        }
    }

    @ApiOkResponse({
        description: 'Modify a map',
        type: Map,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Put('/edition/:mapId')
    async modifyMap(@Param('mapId') mapId: string, @Body() mapDto: MapDto, @Res() response: Response) {
        try {
            const updatedMap = await this.adminService.modifyMap(mapId, mapDto);
            response.status(HttpStatus.OK).json(updatedMap);
        } catch (error) {
            return response.status(error.status || HttpStatus.BAD_REQUEST).json({
                status: error.status || HttpStatus.BAD_REQUEST,
                message: error.message || 'La modification du jeu a échoué',
            });
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
            response.status(HttpStatus.NOT_FOUND).send(error);
        }
    }

    @ApiOkResponse({
        description: 'Delete a course',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Delete('/:mapId')
    async deleteCourse(@Param('mapId') mapId: string, @Res() response: Response) {
        try {
            await this.adminService.deleteMap(mapId);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            return response.status(error.status || HttpStatus.BAD_REQUEST).json({
                status: error.status || HttpStatus.BAD_REQUEST,
                message: error.message || 'La supression du jeu a échoué',
            });
        }
    }
}
