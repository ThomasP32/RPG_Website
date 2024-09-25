import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
<<<<<<< Updated upstream
import { IsArray, IsBoolean, IsNumber, IsString, Validate, ValidateNested} from 'class-validator';
import { IsOutOfMap } from './map.dto.constraints';
import { TileCategory, ItemCategory } from '@common/map.types';
=======
import { ArrayNotEmpty, IsArray, IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
>>>>>>> Stashed changes

export class CoordinateDto {
    @ApiProperty()
    @IsNumber()
    @IsPositive()
    x: number;

    @ApiProperty()
    @IsNumber()
    @IsPositive()
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

    @ApiProperty({ default: false })
    @IsBoolean()
    isVisible: boolean;

    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    mapSize: CoordinateDto;

    @ApiProperty({ type: [StartTileDto] })
    @IsArray()
<<<<<<< Updated upstream
    @ValidateNested({ each: true })
    @Validate(IsOutOfMap)
=======
    @ArrayNotEmpty()
    @ValidateNested()
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    lastModified?: Date;

    @ApiProperty()
>>>>>>> Stashed changes
    _id?: string;
}
