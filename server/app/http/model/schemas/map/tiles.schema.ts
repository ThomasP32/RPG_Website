import { DoorTile as DoorTileType, TileCategory, Tile as TileType } from '@common/map.types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Coordinate, coordinateSchema } from '@app/http/model/schemas/map/coordinate.schema';

export
@Schema({ _id: false })
class DoorTile implements DoorTileType {
    @ApiProperty()
    @Prop({ type: coordinateSchema, required: true, _id: false })
    coordinate: Coordinate;

    @ApiProperty({ default: false })
    @Prop({ type: Boolean, required: false, default: false })
    isOpened: boolean;
}

export const doorTileSchema = SchemaFactory.createForClass(DoorTile);

export
@Schema({ _id: false })
class Tile implements TileType {
    @ApiProperty()
    @Prop({ type: coordinateSchema, required: true, _id: false })
    coordinate: Coordinate;

    @ApiProperty()
    @Prop({ type: String, enum: TileCategory, required: true })
    category: TileCategory;
}

export const tileSchema = SchemaFactory.createForClass(Tile);
