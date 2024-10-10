import { Player as PlayerType } from '@common/player';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export type PlayerDocument = Player & Document;

@Schema()
export class Player implements PlayerType {
    @ApiProperty()
    _id: Types.ObjectId;

    @ApiProperty()
    @Prop({ required: true })
    avatarType: number;

    @ApiProperty()
    @Prop({ required: true })
    gameId: string;

    @ApiProperty()
    @Prop({ required: true })
    name: string;

    @ApiProperty()
    @Prop({ required: true })
    life: number;

    @ApiProperty()
    @Prop({ required: true })
    speed: number;

    @ApiProperty()
    @Prop({ required: true })
    attack: number;

    @ApiProperty()
    @Prop({ required: true })
    defense: number;
}
export const playerSchema = SchemaFactory.createForClass(Player);
