import { Game } from '@app/model/database/game';
import { CreateGameDto } from '@app/model/dto/game/create-game.dto';
import { GameService } from '@app/services/game/game.service';
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Game') // to attach a controller to a specific tag
@Controller('game') // marque la classe comme un contrôleur pour les routes qui commence avec game donc reponde au requete http faites vers l'url /game
export class GameController {
    constructor(private readonly gamesService: GameService) {} // créé une instance de la classe avec un service de cours

    @ApiOkResponse({
        description: 'Returns all games',
        type: Game,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/')
    async allGames(@Res() response: Response) {
        try {
            const allCourses = await this.gamesService.getAllGames();
            response.status(HttpStatus.OK).json(allCourses);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error);
        }
    }

    @ApiOkResponse({
        description: 'Get game by name',
        type: Game,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/:gameName')
    async subjectCode(@Param('gameName') subjectCode: string, @Res() response: Response) {
        try {
            const course = await this.gamesService.getGame(subjectCode);
            response.status(HttpStatus.OK).json(course);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiCreatedResponse({
        description: 'Add new game',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Post('/')
    async addGame(@Body() gameDto: CreateGameDto, @Res() response: Response) {
        try {
            await this.gamesService.addGame(gameDto);
            console.log('Requête POST reçue avec les données :', gameDto);
            response.status(HttpStatus.CREATED).send();
        } catch (error) {
            response.status(HttpStatus.BAD_REQUEST).send(error);
        }
    }

    // @ApiOkResponse({
    //     description: 'Modify a course',
    //     type: Game,
    // })
    // @ApiNotFoundResponse({
    //     description: 'Return NOT_FOUND http status when request fails',
    // })
    // @Patch('/')
    // async modifyCourse(@Body() courseDto: UpdateCourseDto, @Res() response: Response) {
    //     try {
    //         await this.coursesService.modifyCourse(courseDto);
    //         response.status(HttpStatus.OK).send();
    //     } catch (error) {
    //         response.status(HttpStatus.NOT_FOUND).send(error.message);
    //     }
    // }

    @ApiOkResponse({
        description: 'Delete a course',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Delete('/:subjectCode')
    async deleteCourse(@Param('subjectCode') gameName: string, @Res() response: Response) {
        try {
            await this.gamesService.deleteGame(gameName);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    // @ApiOkResponse({
    //     description: 'Get a specific course teacher',
    //     type: String,
    // })
    // @ApiNotFoundResponse({
    //     description: 'Return NOT_FOUND http status when request fails',
    // })
    // @Get('/teachers/code/:subjectCode')
    // async getCourseTeacher(@Param('subjectCode') subjectCode: string, @Res() response: Response) {
    //     try {
    //         const teacher = await this.coursesService.getCourseTeacher(subjectCode);
    //         response.status(HttpStatus.OK).json(teacher);
    //     } catch (error) {
    //         response.status(HttpStatus.NOT_FOUND).send(error.message);
    //     }
    // }

    // @ApiOkResponse({
    //     description: 'Get specific teacher courses',
    //     type: Course,
    //     isArray: true,
    // })
    // @ApiNotFoundResponse({
    //     description: 'Return NOT_FOUND http status when request fails',
    // })
    // @Get('/teachers/name/:name')
    // async getCoursesByTeacher(@Param('name') name: string, @Res() response: Response) {
    //     try {
    //         const courses = await this.coursesService.getCoursesByTeacher(name);
    //         response.status(HttpStatus.OK).json(courses);
    //     } catch (error) {
    //         response.status(HttpStatus.NOT_FOUND).send(error.message);
    //     }
    // }
}
