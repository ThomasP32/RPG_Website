import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsString, Validate, ValidateNested, IsOptional, IsDate } from 'class-validator';
import { IsInsideMap } from './map.dto.constraints';

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
    @IsBoolean()
    isVisible: boolean;

    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    mapSize: CoordinateDto;

    @ApiProperty({ type: [StartTileDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Validate(IsInsideMap)
    @Type(() => StartTileDto)
    startTiles: StartTileDto[];

    @ApiProperty({ type: [ItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Validate(IsInsideMap)
    @Type(() => ItemDto)
    items: ItemDto[];

    @ApiProperty({ type: [TileDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Validate(IsInsideMap)
    @Type(() => TileDto)
    tiles: TileDto[];

    @ApiProperty({ type: [DoorTileDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Validate(IsInsideMap)
    @Type(() => DoorTileDto)
    doorTiles: DoorTileDto[];

    @ApiProperty({ required: false }) 
    @IsOptional()
    @IsDate()
    @Type(() => Date) 
    lastModified?: Date; 

    @ApiProperty()
    _id?: string;
}
