import { Coordinate as CoordinateType, DoorTile as DoorTileType, Game as GameType } from '@common/game.type';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type GameDocument = Game & Document;

@Schema({ _id: false })
export class Coordinate implements CoordinateType {
    @ApiProperty()
    @Prop({ required: true })
    x: number;

    @ApiProperty()
    @Prop({ required: true })
    y: number;
}

export const CoordinateSchema = SchemaFactory.createForClass(Coordinate);

@Schema({ _id: false })
class DoorTile implements DoorTileType {
    @ApiProperty({ type: Coordinate })
    @Prop({ type: CoordinateSchema, required: true, _id: false })
    coordinate: Coordinate;

    @ApiProperty({ default: false })
    @Prop({ type: Boolean, required: false, default: false })
    isOpened: boolean;
}

export const doorTileSchema = SchemaFactory.createForClass(DoorTile);

@Schema()
export class Game implements GameType {
    @ApiProperty()
    @Prop({ type: String, required: true })
    name: string;

    @ApiProperty()
    @Prop({ type: Boolean, required: false, default: false })
    isVisible: boolean;

    @ApiProperty({ type: Coordinate })
    @Prop({ type: CoordinateSchema, required: true })
    mapSize: Coordinate;

    @ApiProperty({ type: [Coordinate] })
    @Prop({ type: [CoordinateSchema], required: true })
    startTiles: Coordinate[];

    @ApiProperty({ type: Coordinate })
    @Prop({ type: CoordinateSchema, required: true })
    attributeItem1: Coordinate;

    @ApiProperty({ type: Coordinate })
    @Prop({ type: CoordinateSchema, required: true })
    attributeItem2: Coordinate;

    @ApiProperty({ type: Coordinate })
    @Prop({ type: CoordinateSchema, required: true })
    conditionItem1: Coordinate;

    @ApiProperty({ type: Coordinate })
    @Prop({ type: CoordinateSchema, required: true })
    conditionItem2: Coordinate;

    @ApiProperty({ type: Coordinate })
    @Prop({ type: CoordinateSchema, required: true })
    functionItem1: Coordinate;

    @ApiProperty({ type: Coordinate })
    @Prop({ type: CoordinateSchema, required: true })
    functionItem2: Coordinate;

    @ApiProperty({ type: [Coordinate] })
    @Prop({ type: [CoordinateSchema], required: true })
    waterTiles: Coordinate[];

    @ApiProperty({ type: [Coordinate] })
    @Prop({ type: [CoordinateSchema], required: true })
    iceTiles: Coordinate[];

    @ApiProperty({ type: [Coordinate] })
    @Prop({ type: [CoordinateSchema], required: true })
    wallTiles: Coordinate[];

    @ApiProperty({ type: [DoorTile] })
    @Prop({ type: [doorTileSchema], required: true })
    doorTiles: DoorTile[];

    @ApiProperty()
    _id?: string;
}

export const gameSchema = SchemaFactory.createForClass(Game);
