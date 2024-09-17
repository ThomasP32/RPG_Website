import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString, Validate, ValidateNested, IsIn } from 'class-validator';
import { IsOutOfMap } from './map.dto.constraints';
import { TileCategory, ItemCategory } from '@common/map.types';

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
    @IsIn(['water', 'ice', 'wall'])
    category: TileCategory;
}

export class ItemDto {
    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    coordinate: CoordinateDto;

    @ApiProperty()
    @IsIn(['sword'])
    category: ItemCategory;
}

export class CreateMapDto {
    @ApiProperty()
    @IsString()
    name: string;

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
    @Validate(IsOutOfMap)
    @Type(() => StartTileDto)
    startTiles: StartTileDto[];

    @ApiProperty({ type: [ItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Validate(IsOutOfMap)
    @Type(() => ItemDto)
    items: ItemDto[];

    @ApiProperty({ type: [TileDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Validate(IsOutOfMap)
    @Type(() => TileDto)
    tiles: TileDto[];

    @ApiProperty({ type: [DoorTileDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Validate(IsOutOfMap)
    @Type(() => DoorTileDto)
    doorTiles: DoorTileDto[];

    @ApiProperty()
    _id?: string;
}
