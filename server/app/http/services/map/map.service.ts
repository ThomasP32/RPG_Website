import { MapDocument } from '@app/http/model/schemas/map/map.schema';
import { Map } from '@common/map.types';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class MapService {
    @InjectModel(Map.name) public mapModel: Model<MapDocument>;

    async getAllVisibleMaps(): Promise<Map[]> {
        return await this.mapModel.find({ isVisible: true }, { _id: 0, isVisible: 0, lastModified: 0 });
    }

    async getMapByName(mapName: string): Promise<Map> {
        const map = await this.mapModel.findOne({ name: mapName, isVisible: true }, { _id: 0, isVisible: 0, lastModified: 0 });
        if (!map) {
            throw new Error(`Failed to find visible map : ${mapName}`);
        }
        return map;
    }
}
