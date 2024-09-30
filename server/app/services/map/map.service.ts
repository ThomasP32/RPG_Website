import { MapDto } from '@app/model/dto/map/map.dto';
import { MapDocument } from '@app/model/schemas/map.schema';
import { DBMap, ItemCategory, Mode, TileCategory } from '@common/map.types';
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
        const maps: MapDto[] = [
            {
                name: 'DB Populate',
                description: 'un simple jeu',
                mode: Mode.Ctf,
                imagePreview: 'url dimage',
                mapSize: { x: 10, y: 10 },
                startTiles: [{ coordinate: { x: 5, y: 1 } }],
                items: [{ coordinate: { x: 1, y: 3 }, category: ItemCategory.Hat }],
                tiles: [{ coordinate: { x: 3, y: 4 }, category: TileCategory.Ice }],
                doorTiles: [{ coordinate: { x: 1, y: 2 }, isOpened: true }],
            },
        ];
        await this.mapModel.insertMany(maps);
        this.logger.log('THIS ADDS DATA TO THE DATABASE, DO NOT USE OTHERWISE');
    }

    async getAllVisibleMaps(): Promise<DBMap[]> {
        return await this.mapModel.find({ isVisible: true });
    }

    async getMapByName(mapName: string): Promise<DBMap> {
        const map = await this.mapModel.findOne({ name: mapName, isVisible: true });
        if (!map) {
            throw new Error(`Failed to find visible map : ${mapName}`);
        }
        return map;
    }
}
