import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ObjectId } from 'mongoose';

export class CoordinateDto {
    @ApiProperty()
    @IsNumber()
    x: number;

    @ApiProperty()
    @IsNumber()
    y: number;
}

export class DoorTileDto {
    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    coordinate: CoordinateDto;

    @ApiProperty({ default: false })
    @IsBoolean()
    isOpened: boolean;
}

export class StartTileDto {
    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    coordinate: CoordinateDto;
}

export class TileDto {
    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    coordinate: CoordinateDto;

    @ApiProperty()
    category: TileCategory;
}

export class ItemDto {
    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    coordinate: CoordinateDto;

    @ApiProperty()
    category: ItemCategory;
}

export class CreateMapDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty({ type: String, enum: Mode })
    @IsEnum(Mode)
    mode: Mode;

    @ApiProperty()
    @IsString()
    imagePreview: string;

    @ApiProperty({ default: false })
    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;

    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    mapSize: CoordinateDto;

    @ApiProperty({ type: [StartTileDto] })
    @IsArray()
    @ValidateNested()
    @Type(() => StartTileDto)
    startTiles: StartTileDto[];

    @ApiProperty({ type: [ItemDto] })
    @IsArray()
    @ValidateNested()
    @Type(() => ItemDto)
    items: ItemDto[];

    @ApiProperty({ type: [TileDto] })
    @IsArray()
    @ValidateNested()
    @Type(() => TileDto)
    tiles: TileDto[];

    @ApiProperty({ type: [DoorTileDto] })
    @IsArray()
    @ValidateNested()
    @Type(() => DoorTileDto)
    doorTiles: DoorTileDto[];

    @ApiProperty()
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    lastModified?: Date;

    @ApiProperty()
    _id?: ObjectId;
}
