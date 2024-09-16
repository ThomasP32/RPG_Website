import { Game, GameDocument } from '@app/model/database/game';
import { CreateGameDto} from '@app/model/dto/game/create-game.dto';
import { Injectable, Logger} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class GameService {
    constructor(
        @InjectModel(Game.name) public gameModel: Model<GameDocument>,
        private readonly logger: Logger,
    ) {
        this.start();
    }

    async start() {
        if ((await this.gameModel.countDocuments()) === 0) {
            await this.populateDB();
        }
    }

    async populateDB(): Promise<void> {
        const games: CreateGameDto[] = [
            {
                name: 'Test de jeu',
                isVisible: false,
                mapSize: { x: 10, y: 10 },
                startTiles: [{ x: 2, y: 2 }],
                attributeItem1: { x: 1, y: 3 },
                attributeItem2: { x: 0, y: 4 },
                conditionItem1: { x: 4, y: 0 },
                conditionItem2: { x: 0, y: 2 },
                functionItem1: { x: 0, y: 1 },
                functionItem2: { x: 1, y: 0 },
                waterTiles: [{ x: 3, y: 4 }],
                iceTiles: [{ x: 2, y: 4 }],
                wallTiles: [{ x: 1, y: 4 }],
                doorTiles: [{ coordinate: { x: 1, y: 2 }, isOpened: true }],
            },
        ];
        await this.gameModel.insertMany(games);
        this.logger.log('THIS ADDS DATA TO THE DATABASE, DO NOT USE OTHERWISE');
        
    }
    async getAllGames(): Promise<Game[]> {
        return await this.gameModel.find({});
    }
    async getGame(gameName: string): Promise<Game> {
        try {
            return await this.gameModel.findOne({ name: gameName });
        } catch (err) {
            return Promise.reject(`Failed to find game: ${err}`);
        }
    }
    async addGame(game: CreateGameDto): Promise<void> {
        if (!(await this.isUnique(game.name))) {
            return Promise.reject('Game name must be unique' + game.name);
        }

        try {
            await this.gameModel.create(game);
        } catch (err) {
            return Promise.reject(`Failed to insert game: ${err}`);
        }
    }
    async deleteGame(gameName: string): Promise<void> {
        try {
            const res = await this.gameModel.deleteOne({
                subjectCode: gameName,
            });
            if (res.deletedCount === 0) {
                return Promise.reject('Could not find course');
            }
        } catch (err) {
            return Promise.reject(`Failed to delete course: ${err}`);
        }
    }

    // possibilité de créer un constraint avec class validator et de l'appliquer sur le dto pour eviter tout ca 
    // private isOutOfBounds2(coordinates: CoordinateDto[], mapSize: number) {
    //     for(const coordinate of coordinates) {
    //         if(this.isOutOfBounds(coordinate, mapSize)) {
    //             return true
    //         }
    //     }
    //     return false;
    // }
    // private isOutOfBounds(coordinate: CoordinateDto, mapSize: number) {
    //     if (coordinate.x > mapSize || coordinate.x < 0 || coordinate.y > mapSize || coordinate.y < 0 ) {
    //         return false;
    //     }
    //     return true;
    // }

    // private verifyGameCoordinates(game : CreateGameDto) {
    //     if (this.isOutOfBounds2(game.startTiles, game.mapSize.x) || 
    //         this.isOutOfBounds2(game.wallTiles, game.mapSize.x) ||
    //         this.isOutOfBounds2(game.iceTiles, game.mapSize.x) || 
    //         this.isOutOfBounds2(game.waterTiles, game.mapSize.x) || 
    //         this.isOutOfBounds2(game.doorTiles.map(doorTile => doorTile.coordinate), game.mapSize.x) ||  
    //         this.isOutOfBounds(game.attributeItem1, game.mapSize.x) ||
    //         this.isOutOfBounds(game.attributeItem2, game.mapSize.x) ||
    //         this.isOutOfBounds(game.conditionItem1, game.mapSize.x) ||
    //         this.isOutOfBounds(game.conditionItem2, game.mapSize.x) ||
    //         this.isOutOfBounds(game.functionItem1, game.mapSize.x) ||
    //         this.isOutOfBounds(game.functionItem2, game.mapSize.x) ) {
    //             return true

    //         }
    //         return false
    // }
    // ----------------------->
    async isUnique(gameName : string): Promise<boolean> {
        if(await this.getGame(gameName)) {
            return false;
        }
        return true;
    }


}
