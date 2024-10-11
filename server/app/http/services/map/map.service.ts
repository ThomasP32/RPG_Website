import { MapDocument } from '@app/http/model/schemas/map/map.schema';
import { DBMap } from '@common/map.types';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class MapService {
    @InjectModel(Map.name) public mapModel: Model<MapDocument>;

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
