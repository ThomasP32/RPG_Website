import { ItemCategory, Item as ItemType, DBMap as MapType, Mode } from '@common/map.types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { Coordinate, coordinateSchema, StartTile, startTileSchema } from './coordinate.schema';
import { DoorTile, doorTileSchema, Tile, tileSchema } from './tiles.schema';

export type MapDocument = Map & Document;

@Schema({ _id: false })
class Item implements ItemType {
    @ApiProperty()
    @Prop({ type: coordinateSchema, required: true, _id: false })
    coordinate: Coordinate;

    @ApiProperty()
    @Prop({ type: String, enum: ItemCategory, required: true })
    category: ItemCategory;
}

export const itemTileSchema = SchemaFactory.createForClass(Item);

@Schema({ timestamps: { createdAt: false, updatedAt: 'lastModified' } })
export class Map implements MapType {
    @ApiProperty()
    @Prop({ type: String, required: true })
    name: string;

    @ApiProperty()
    @Prop({ type: String, required: true })
    description: string;

    @ApiProperty()
    @Prop({ type: String, required: true })
    imagePreview: string;

    @ApiProperty()
    @Prop({ type: String, enum: Mode, required: true })
    mode: Mode;

    @ApiProperty()
    @Prop({ type: coordinateSchema, required: true })
    mapSize: Coordinate;

    @ApiProperty()
    @Prop({ type: [startTileSchema], required: true })
    startTiles: StartTile[];

    @ApiProperty()
    @Prop({ type: [itemTileSchema], required: true })
    items: Item[];

    @ApiProperty()
    @Prop({ type: [tileSchema], required: true })
    tiles: Tile[];

    @ApiProperty()
    @Prop({ type: [doorTileSchema], required: true })
    doorTiles: DoorTile[];

    @ApiProperty()
    @Prop({ type: Boolean, required: false, default: false })
    isVisible: boolean;

    @ApiProperty()
    @Prop({ type: Date, alias: 'updatedAt' })
    lastModified: Date;

    @ApiProperty()
    _id: Types.ObjectId;
}

export const mapSchema = SchemaFactory.createForClass(Map);
