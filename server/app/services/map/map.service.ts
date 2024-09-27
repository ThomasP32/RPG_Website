import { CreateMapDto } from '@app/model/dto/map/create-map.dto';
import { MapDocument } from '@app/model/schemas/map';
import { ItemCategory, Map, Mode, TileCategory } from '@common/map.types';
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
                name: 'DB Populate',
                description: 'un simple jeu',
                mode: Mode.Ctf,
                imagePreview: 'url dimage',
                isVisible: true,
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

    async getAllVisibleMaps(): Promise<Map[]> {
        return await this.mapModel.find({ isVisible: true });
    }

    async getMapByName(mapName: string): Promise<Map> {
        const map = await this.mapModel.findOne({ name: mapName, isVisible: true });
        if (!map) {
            throw new Error(`Failed to find visible map : ${mapName}`);
        }
        return map;
    }
}
