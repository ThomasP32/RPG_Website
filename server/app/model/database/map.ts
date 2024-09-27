import {
    Coordinate as CoordinateType,
    DoorTile as DoorTileType,
    ItemCategory,
    Item as ItemType,
    Map as MapType,
    Mode,
    StartTile as StartTileType,
    TileCategory,
    Tile as TileType,
} from '@common/map.types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type MapDocument = Map & Document;

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

@Schema({ _id: false })
class DoorTile implements DoorTileType {
    @ApiProperty({ type: Coordinate })
    @Prop({ type: coordinateSchema, required: true, _id: false })
    coordinate: Coordinate;

    @ApiProperty({ default: false })
    @Prop({ type: Boolean, required: false, default: false })
    isOpened: boolean;
}

export const doorTileSchema = SchemaFactory.createForClass(DoorTile);

@Schema({ _id: false })
class Tile implements TileType {
    @ApiProperty({ type: Coordinate })
    @Prop({ type: coordinateSchema, required: true, _id: false })
    coordinate: Coordinate;

    @ApiProperty()
    @Prop({ type: String, enum: TileCategory, required: true })
    category: TileCategory;
}

export const tileSchema = SchemaFactory.createForClass(Tile);

@Schema({ _id: false })
class StartTile implements StartTileType {
    @ApiProperty({ type: Coordinate })
    @Prop({ type: coordinateSchema, required: true, _id: false })
    coordinate: Coordinate;
}

export const startTileSchema = SchemaFactory.createForClass(StartTile);

@Schema({ _id: false })
class Item implements ItemType {
    @ApiProperty({ type: Coordinate })
    @Prop({ type: coordinateSchema, required: true, _id: false })
    coordinate: Coordinate;

    @ApiProperty()
    @Prop({ type: String, enum: ItemCategory, required: true })
    category: ItemCategory;

    // Attributs supplémentaires seront ajouté ici
}

export const itemTileSchema = SchemaFactory.createForClass(Item);

@Schema()
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
    @Prop({ type: Boolean, required: false, default: false })
    isVisible?: boolean;

    @ApiProperty({ type: Coordinate })
    @Prop({ type: coordinateSchema, required: true })
    mapSize: Coordinate;

    @ApiProperty({ type: [StartTile] })
    @Prop({ type: [startTileSchema], required: true })
    startTiles: StartTile[];

    @ApiProperty({ type: [Item] })
    @Prop({ type: [itemTileSchema], required: true })
    items: Item[];

    @ApiProperty({ type: [Tile] })
    @Prop({ type: [tileSchema], required: true })
    tiles: Tile[];

    @ApiProperty({ type: [DoorTile] })
    @Prop({ type: [doorTileSchema], required: true })
    doorTiles: DoorTile[];

    @ApiProperty()
    @Prop({ type: Date })
    lastModified?: Date;

    @ApiProperty()
    _id?: Types.ObjectId;
}

export const mapSchema = SchemaFactory.createForClass(Map);