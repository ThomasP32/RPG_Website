import { Coordinate as CoordinateType, StartTile as StartTileType } from '@common/map.types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Coordinate implements CoordinateType {
    @ApiProperty()
    @Prop({ required: true })
    x: number;

    @ApiProperty()
    @Prop({ required: true })
    y: number;
}

export const coordinateSchema = SchemaFactory.createForClass(Coordinate);

export
@Schema({ _id: false })
class StartTile implements StartTileType {
    @ApiProperty()
    @Prop({ type: coordinateSchema, required: true, _id: false })
    coordinate: Coordinate;
}

export const startTileSchema = SchemaFactory.createForClass(StartTile);
