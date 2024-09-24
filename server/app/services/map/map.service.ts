import { Map, MapDocument } from '@app/model/database/map';
import { CreateMapDto } from '@app/model/dto/map/create-map.dto';
import { ItemCategory, TileCategory, Mode} from '@common/map.types';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class MapService {
    constructor(
        @InjectModel(Map.name) public mapModel: Model<MapDocument>,
        private readonly logger: Logger,
    ) {
        this.start();
    }

    async start() {
        if ((await this.mapModel.countDocuments()) === 0) {
            await this.populateDB();
        }
    }

    async populateDB(): Promise<void> {
        const maps: CreateMapDto[] = [
            {
                name: 'Test de jeu',
                description: 'un simple jeu', 
                mode: Mode.Ctf, 
                imagePreview: 'url dimage',
                isVisible: false,
                mapSize: { x: 10, y: 10 },
                startTiles: [{ coordinate: { x: 5, y: 1 } }],
                items: [{ coordinate: { x: 1, y: 3 }, category: ItemCategory.Sword }],
                tiles: [{ coordinate: { x: 3, y: 4 }, category: TileCategory.Ice }],
                doorTiles: [{ coordinate: { x: 1, y: 2 }, isOpened: true }],
            },
        ];
        await this.mapModel.insertMany(maps);
        this.logger.log('THIS ADDS DATA TO THE DATABASE, DO NOT USE OTHERWISE');
    }
    async getAllMaps(): Promise<Map[]> {
        return await this.mapModel.find({});
    }
    async getMap(mapName: string): Promise<Map> {
        try {
            return await this.mapModel.findOne({ name: mapName });
        } catch (err) {
            return Promise.reject(`Failed to find map: ${err}`);
        }
    }
    async addMap(map: CreateMapDto): Promise<void> {
        if (!(await this.isUnique(map.name))) {
            return Promise.reject('Map name must be unique' + map.name);
        }

        try {
            await this.mapModel.create(map);
        } catch (err) {
            return Promise.reject(`Failed to insert map: ${err}`);
        }
    }
    async deleteMap(mapName: string): Promise<void> {
        try {
            const res = await this.mapModel.deleteOne({
                subjectCode: mapName,
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

    // private verifyMapCoordinates(map : CreateMapDto) {
    //     if (this.isOutOfBounds2(map.startTiles, map.mapSize.x) ||
    //         this.isOutOfBounds2(map.wallTiles, map.mapSize.x) ||
    //         this.isOutOfBounds2(map.iceTiles, map.mapSize.x) ||
    //         this.isOutOfBounds2(map.waterTiles, map.mapSize.x) ||
    //         this.isOutOfBounds2(map.doorTiles.map(doorTile => doorTile.coordinate), map.mapSize.x) ||
    //         this.isOutOfBounds(map.attributeItem1, map.mapSize.x) ||
    //         this.isOutOfBounds(map.attributeItem2, map.mapSize.x) ||
    //         this.isOutOfBounds(map.conditionItem1, map.mapSize.x) ||
    //         this.isOutOfBounds(map.conditionItem2, map.mapSize.x) ||
    //         this.isOutOfBounds(map.functionItem1, map.mapSize.x) ||
    //         this.isOutOfBounds(map.functionItem2, map.mapSize.x) ) {
    //             return true

    //         }
    //         return false
    // }
    // ----------------------->
    async isUnique(mapName: string): Promise<boolean> {
        if (await this.getMap(mapName)) {
            return false;
        }
        return true;
    }
}
